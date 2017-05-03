import {Injectable} from '@angular/core';
import {BankAccountTransaction} from './provider-interface';
import {Logger} from '../services/logger';
import {Engine} from '../engine/engine';
import {BankTransaction} from '../data/records/bank-transaction';
import {Account} from '../data/records/account';
import Big from 'big.js';

@Injectable()
export class TransactionSync {

    private logger = Logger.get('TransactionSync');

    constructor(private engine: Engine) {

    }

    merge(account: Account, bankAccountTransactions: BankAccountTransaction[]) {

        //TODO: The page for viewing them
        //TODO: A "clear" button for the bank transactions

        //TODO: Then improve this to merge, just get it to "Add" first

        // bankAccountTransaction Sort - processed | authorised | recent, date
        let existingBankTransactions = this.engine.db.transactionProcessor.table(BankTransaction).find({'accountId': account.id}).sort((a, b) => {
            todo
            // Sort - processed | authorised | recent, date, id
            return Number(b.date) - Number(a.date);
        }).data();

        bankAccountTransactions.forEach(t => {
            // TODO: Any kind of description filtering
            (<any> t).amountBig = new Big(t.amount);
        });

        // TODO: Processed ones first, then authorised, recent ? - REMOVE ONCE MATCHED - eg. sort in that order

        let existingBankTransactionsProcessed = existingBankTransactions.filter(t => t.status === 'processed');

        // Match processed to processed first
        bankAccountTransactions.filter(t => t.status === 'processed').forEach(t => {
            let {record, index} = this.findFirstMatch(t, existingBankTransactionsProcessed);
                // TODO: ID order filtering ?. eg. id > x | index > y ?

                // TODO: Remove onced matched, new records to insert, how to do checks / errors ??? Missing records, etc  after loop ?, eg. records SHOULD match in a block and be no newer processed ones, and index should be + 1 after the first match

                // TODO: Then should be no matches after a non-match (which should be at the highest index)

                // TODO: Think about how this will work for 
        });

        let existingBankTransactionsNotProcessed = existingBankTransactions.filter(t => t.status !== 'processed');




        



    }

    findFirstMatch(bankAccountTransaction: BankAccountTransaction, accountTransactions: BankTransaction[]): {record: BankTransaction; index: Number} {

        let amount = <BigJsLibrary.BigJS> (<any> bankAccountTransaction).amountBig;

        let i = -2;

        if (bankAccountTransaction.status === 'processed') {
            // Processed - match : Date, status, description & amount - full record
            i = accountTransactions.findIndex(t => 
                (t.status === 'processed' && t.amount.eq(amount) && t.date === bankAccountTransaction.transactionDate && t.description == bankAccountTransaction.description)
                || (t.status === 'recent' && t.amount.eq(amount)) // Not sure on description ? // Date >= ?, or within tolerance ?
                || (t.status === 'authorised' && t.amount.eq(amount) && t.date <= bankAccountTransaction.transactionDate) // Processed date >= authorised date
            );

        } else if (bankAccountTransaction.status === 'authorised') {
            // Authorised - match : Date, status = 'authorised, description & amount - full record
            todo
        } else if (bankAccountTransaction.status === 'recent') {
            // Authorised - match : Date, status = 'recent, description & amount - full record
            todo

        } else {
            // error
        }

        return {record: i >= 0 ? accountTransactions[i]: null, index: i};

    }

}