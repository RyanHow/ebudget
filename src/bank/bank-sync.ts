import {Injectable} from '@angular/core';
import {HostInterface} from './host-interface';
import {TransactionSync} from './transaction-sync';

@Injectable()
export class BankSync {

    constructor(hostInterface: HostInterface, transactionSync: TransactionSync) {
        // TODO: HostInterface standard host interface in the providers list in app module
    }

    // TODO: controls the process of syncing the bank account. eg. starts up a provider, gets balances and transactions, etc

    // This will have the method (sync: account) to do a sync of that account

    // Controls concurrency

    // Has an implementation of the HostInterface, eg, for popping up notices, etc (Actually, maybe inject that into here)
    // HostInterface should Also provide a method for giving an InAppBrowser object to the provider if it request it, and managing requests from MULTIPLE in app browsers that are competing...
    // (eg... if 1 is requested to be displayed while another is displayed, then wait)



}