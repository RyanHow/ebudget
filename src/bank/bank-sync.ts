import {Injectable} from '@angular/core';
import {StandardHostInterface} from './standard-host-interface';
import {TransactionSync} from './transaction-sync';
import {BankProviderRegistry} from './bank-provider-registry';
import {Account} from '../data/records/account';
import {Replication} from '../services/replication-service';
import {Engine} from '../engine/engine';
import { BankLink } from "../data/records/bank-link";
import { Configuration, SecureAccessor } from "../services/configuration-service";
import { Dbms } from "../db/dbms";
import { EngineFactory } from "../engine/engine-factory";
import { InAppBrowserInterfaceFactory } from "./in-app-browser-interface-factory";
import { ProviderRequiresBrowser, BrowserInterface } from "./browser-interface";
import { ProviderSchema, ProviderInterface } from "./provider-interface";
import { Logger, LoggerAppender } from "../services/logger";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { Observer } from "rxjs/Observer";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/share";
import { BankLinkLocal } from "./bank-link-local";
import { Utils } from "../services/utils";
import { BankSyncMonitor } from "./bank-sync-monitor";


@Injectable()
export class BankSync {

    activeSyncs: BankSyncMonitor[] = [];


    constructor(private standardHostInterface: StandardHostInterface, private transactionSync: TransactionSync, private bankProviderRegistry: BankProviderRegistry, private replication: Replication, private configuration: Configuration, private dbms: Dbms, private engineFactory: EngineFactory, private inAppBrowserInterfaceFactory: InAppBrowserInterfaceFactory, private bankLinkLocal: BankLinkLocal) {

    }

    sync(bankLink: BankLink, engine: Engine, accounts?: Account[], bankSyncMonitor = new BankSyncMonitor(), backgroundMode: boolean = false): BankSyncMonitor {        

        if (bankSyncMonitor.logger == null) {
            let logger = Logger.get("BankSync.BankLink." + bankLink.name.split(/[^0-9A-Za-z_]/).join());
            logger.config.level = Logger.DEBUG;
            logger.config.addAppender(new class implements LoggerAppender {
                log(level: number, data: any[]) {
                    if (data != null && data.length == 1) bankSyncMonitor.log.push(Logger.stringValue(data[0]));
                    else bankSyncMonitor.log.push(Logger.stringValue(data));
                }
            });

            bankSyncMonitor.logger = logger;
        }

        bankSyncMonitor.backgroundMode = backgroundMode;
        bankSyncMonitor.bankLink = bankLink;
        bankSyncMonitor.engine = engine;

        if (!accounts) accounts = engine.getAccounts().filter(account => account.bankLinkId === bankLink.id);
        if (accounts.length === 0) {
            bankSyncMonitor.error("No Accounts Selected for Sync");
            return bankSyncMonitor;
        }

        bankSyncMonitor.accounts = accounts;
        
        // TODO: Get connected BankLinks in other budgets - this will be run off some kind of locally stored link map of bankLinks
        //this.dbms.dbs.filter(db => db.isActive()).forEach(db => {
        //})        
        
        let provider = this.bankProviderRegistry.newProvider(bankLink.provider);
        let providerSchema = provider.getSchema();
        bankSyncMonitor.provider = provider;
        bankSyncMonitor.providerSchema = providerSchema;

        let secureAccessor = this.configuration.secureAccessor("banklink_" + bankLink.uuid);
        provider.configure(bankLink, secureAccessor, this.standardHostInterface);

        if (providerSchema.singleInstancePerBankLink) {
            if (this.activeSyncs.find(m => m.bankLink.uuid == bankLink.uuid)) {
                bankSyncMonitor.error("Bank Link " + bankLink.name + " is already active");
                return bankSyncMonitor;
            }
        }

        this.activeSyncs.push(bankSyncMonitor);
        bankSyncMonitor.startTime = Date.now();
        bankSyncMonitor.running = true;

        this.doSync(bankSyncMonitor);

        return bankSyncMonitor;
    }

    private archiveSync(bankSyncMonitor: BankSyncMonitor) {
        this.activeSyncs.splice(this.activeSyncs.indexOf(bankSyncMonitor), 1);      
        // TODO: Move to sync history... AND write into local persistence!?
    }


    private async doSync(bankSyncMonitor: BankSyncMonitor) {
        let browserInterface: BrowserInterface;
        let autoClosing = false;

        bankSyncMonitor.on('cancelled-state-change').subscribe(() => {
            this.bankLinkLocal.updateInfo(bankSyncMonitor.bankLink.uuid, info => {
                info.cancelledCount++;
            });
        });

        try {
            await this.replication.sync();

            if (bankSyncMonitor.providerSchema.requireBrowser) {
                bankSyncMonitor.logger.debug("Creating Browser");
                browserInterface = await this.inAppBrowserInterfaceFactory.createBrowser(bankSyncMonitor.logger, bankSyncMonitor.backgroundMode);
                bankSyncMonitor.logger.debug("Created Browser");
                (<ProviderRequiresBrowser> <any> bankSyncMonitor.provider).setBrowser(browserInterface);

                browserInterface.onLoadError().then(reason => {
                    bankSyncMonitor.logger.info("Browser Load Error", reason);
                    bankSyncMonitor.error("Communications Error");
                    browserInterface.close();
                    bankSyncMonitor.provider.interrupt();
                    this.archiveSync(bankSyncMonitor);
                    this.bankLinkLocal.updateInfo(bankSyncMonitor.bankLink.uuid, info => {
                        info.errorCount++;
                    });
                });
                browserInterface.onClose().then(() => {                    
                    bankSyncMonitor.logger.info("Browser Closed");
                    if (!autoClosing) {
                        bankSyncMonitor.cancelled = true;
                        bankSyncMonitor.provider.interrupt();
                        this.archiveSync(bankSyncMonitor);
                    }
                });

            }

            bankSyncMonitor.logger.debug("Connecting...");

            await bankSyncMonitor.provider.connect();
            if (bankSyncMonitor.cancelled) return;

            bankSyncMonitor.logger.debug("Connected. Getting Accounts.");

            let bankAccounts = await bankSyncMonitor.provider.getAccounts();
            if (bankSyncMonitor.cancelled) return;
            
            bankSyncMonitor.logger.debug("Fetched Accounts " + bankAccounts.map(b => b.accountNumber).join(", "));
            
            for (let account of bankSyncMonitor.accounts) {
                let bankAccount = bankAccounts.find(b => bankSyncMonitor.provider.accountMatch(account.bankLinkConfiguration, b));
                if (bankAccount == null) {
                    bankSyncMonitor.logger.info("No Matching Bank Account found for Account " + account.name);
                    bankSyncMonitor.error("No Matching Bank Account found for Account");
                    continue;
                }
                bankSyncMonitor.logger.debug("Fetching Transactions for Account " + bankAccount.accountNumber);
                let transactions = await bankSyncMonitor.provider.getTransactions(bankAccount);
                if (bankSyncMonitor.cancelled) return;
                bankSyncMonitor.logger.debug("Merging Transactions");
                this.transactionSync.merge(bankSyncMonitor.engine, account, bankAccount, transactions);
            }

            bankSyncMonitor.logger.debug("Closing Connection");
            
            autoClosing = true;

            await bankSyncMonitor.provider.close();

            bankSyncMonitor.logger.debug("Complete");
            
            bankSyncMonitor.complete = true;

            this.bankLinkLocal.updateInfo(bankSyncMonitor.bankLink.uuid, info => {
                info.errorCount = 0;
                info.cancelledCount = 0;
                info.lastSync = Date.now();
            });

        } catch (e) {
            bankSyncMonitor.error(e + "");
            // TODO differentiate between an error and an exception (unhandled)
            bankSyncMonitor.logger.info("Bank sync aborted due to error", e);
            bankSyncMonitor.provider.interrupt();
            this.bankLinkLocal.updateInfo(bankSyncMonitor.bankLink.uuid, info => {
                info.errorCount++;
            });
        } finally {
            bankSyncMonitor.running = false;
            if (browserInterface != null && !browserInterface.closed) {
                autoClosing = true;
                browserInterface.close();
            }
            this.archiveSync(bankSyncMonitor);
        }
    }


    // This will have the method (sync: account) to do a sync of that account

    // TODO: If the same bank account link occurs in mulitple "budgets", maybe can do them all at once? (Would require activating budgets...). This would need to be stored in the bank account manager.

    // Controls concurrency

    // Has an implementation of the HostInterface, eg, for popping up notices, etc (Actually, maybe inject that into here)
    // HostInterface should Also provide a method for giving an InAppBrowser object to the provider if it request it, and managing requests from MULTIPLE in app browsers that are competing...
    // (eg... if 1 is requested to be displayed while another is displayed, then wait)

    // Can also have multiple inAppBrowsers - and manage each of them separately, track them and close appropriately

    // Also, some interfaces MAY NOT NEED an in app browser, and may simply be an API Call.

    // Also, the generic browser provider will need to be able to be configured, store data on it's configuration, etc.

    // TODO: A need a standard, flexible, but trackable API for the app, and have flexibility in the provider - Provides good feedback of what it is doing, cancellable, inspectible, error reporting, "transparent" in that can feel confident you know what is going on.
    // So for UI it means a current status - and ability to open browser if wanted (or view data transferred for an API), log the scripts, or API calls.


}