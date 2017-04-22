import {Injectable} from '@angular/core';
import {BankAccountTransaction} from './provider-interface';
import {Logger} from '../services/logger';

@Injectable()
export class TransactionSync {

    private logger = Logger.get('TransactionSync');

    merge(bankAccountTransactions: BankAccountTransaction[]) {

        // TODO: Takes the bank transactions from the interface and "syncs" with the transactions in the database, generating db-transactions that will sync everything

        bankAccountTransactions.forEach(t => this.logger.info(t));
    }



}