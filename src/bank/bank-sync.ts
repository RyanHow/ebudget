import {Injectable} from '@angular/core';
import {StandardHostInterface} from './standard-host-interface';
import {TransactionSync} from './transaction-sync';
import {BankProviderManager} from './bank-provider-manager';

@Injectable()
export class BankSync {

    constructor(private standardHostInterface: StandardHostInterface, private transactionSync: TransactionSync, private bankProviderManager: BankProviderManager) {

    }

    async sync(providerName: string, accountNumber: string) {
        
        let provider = this.bankProviderManager.newProvider(providerName);
        await provider.connect(this.standardHostInterface);
        let bankAccounts = await provider.getAccounts();
        let bankAccount = bankAccounts.find(b => accountNumber == b.accountNumber);
        let transactions = await provider.getTransactions(bankAccount);
        this.transactionSync.merge(transactions);
        await provider.close();
    }

    // TODO: controls the process of syncing the bank account. eg. starts up a provider, gets balances and transactions, etc

    // This will have the method (sync: account) to do a sync of that account

    // Controls concurrency

    // Has an implementation of the HostInterface, eg, for popping up notices, etc (Actually, maybe inject that into here)
    // HostInterface should Also provide a method for giving an InAppBrowser object to the provider if it request it, and managing requests from MULTIPLE in app browsers that are competing...
    // (eg... if 1 is requested to be displayed while another is displayed, then wait)



}