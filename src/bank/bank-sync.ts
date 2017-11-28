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

    // TODO: Sync should return a handle to the sync process, which can then be awaited, cancelled, have events watched on it, etc, accounts can also be multiple (for instance if we have the 1 budget, we can sync multiple accounts from the same provider at the same time)
    //

    async sync(providerName: string, account: Account, engine: Engine) {        

        // TODO: Want to handle errors from this gracefully - Unable to sync budget prior to bank account linking... (maybe a force to do it anyway?)
        await this.replication.sync();

        let provider = this.bankProviderManager.newProvider(providerName);

        // Note here, we need to be able to share credentials between accounts - a "provider" needs to be a higher level entity and can be linked to multiple "accounts"
        this.standardHostInterface.accountId = account.id;
        this.standardHostInterface.budgetId = engine.db.id;
        await provider.connect(this.standardHostInterface);

        // TODO: We don't have to always get accounts, then go to the back account, why can't we go straight by account number?, get accounts is useful for account balance... Just leave it here for now...
        // I think it may be better sending a single request to the provider for ALL the info needed from it

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

    // Can also have multiple inAppBrowsers - and manage each of them separately, track them and close appropriately

    // Also, some interfaces MAY NOT NEED an in app browser, and may simply be an API Call.

    // Also, the generic browser provider will need to be able to be configured, store data on it's configuration, etc.

    // TODO: A need a standard, flexible, but trackable API for the app, and have flexibility in the provider - Provides good feedback of what it is doing, cancellable, inspectible, error reporting, "transparent" in that can feel confident you know what is going on.
    // So for UI it means a current status - and ability to open browser if wanted (or view data transferred for an API), log the scripts, or API calls.


}