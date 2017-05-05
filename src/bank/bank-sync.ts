import {Injectable} from '@angular/core';
import {StandardHostInterface} from './standard-host-interface';
import {TransactionSync} from './transaction-sync';
import {BankProviderManager} from './bank-provider-manager';
import {Account} from '../data/records/account';
import {Replication} from '../services/replication-service';
import {Engine} from '../engine/engine';

@Injectable()
export class BankSync {

    constructor(private standardHostInterface: StandardHostInterface, private transactionSync: TransactionSync, private bankProviderManager: BankProviderManager, private replication: Replication) {

    }

    async sync(providerName: string, account: Account, engine: Engine) {        

        // TODO: Want to handle errors from this gracefully - Unable to sync budget prior to bank account linking... (maybe a force to do it anyway?)
        await this.replication.sync();

        let provider = this.bankProviderManager.newProvider(providerName);
        await provider.connect(this.standardHostInterface);
        let bankAccounts = await provider.getAccounts();
        let bankAccount = bankAccounts.find(b => account.x.accountNumber == b.accountNumber);
        let transactions = await provider.getTransactions(bankAccount);
        this.transactionSync.merge(engine, account, bankAccount, transactions);
        await provider.close();
    }

    // This will have the method (sync: account) to do a sync of that account

    // TODO: If the same bank account link occurs in mulitple "budgets", maybe can do them all at once? (Would require activating budgets...). This would need to be stored in the bank account manager.

    // Controls concurrency

    // Has an implementation of the HostInterface, eg, for popping up notices, etc (Actually, maybe inject that into here)
    // HostInterface should Also provide a method for giving an InAppBrowser object to the provider if it request it, and managing requests from MULTIPLE in app browsers that are competing...
    // (eg... if 1 is requested to be displayed while another is displayed, then wait)



}