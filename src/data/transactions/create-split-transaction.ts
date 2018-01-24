import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {Transaction as TransactionRecord} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import { Big } from 'big.js';

/**
 * Think of this like multiple linked budget transactions. It is in a single DbTransaction
 * so we can operate on it atomically - eg. delete the group of transactions, add it as a
 * single group of transactions. They don't really make sense to have them reside individually.
 * 
 * For Example: A TV is purchased, but needs to be accounted for in multiple categories,
 * or under multiple accounts. eg. a Cash payment and a bank account payment. This TV may
 * also go under 2 different accounts (eg. some of it was to replace an old broken TV and
 * comes under the maintenance, but it was an upgrade and some comes from savings).
 * 
 */
export class CreateSplitTransaction extends DbTransaction {

    description: string;
//    status?: 'realised' | 'anticipated';
    date: string;
    amounts: Array<{
        amount: Big;
        categoryId: number;
    }>;
    accountAmounts: Array<{
        amount: Big;
        accountId: number;

    }>;

    getTypeId(): string {
        return 'CreateSplitTransaction';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(TransactionRecord);
        
        // In the records, keep a list to all the other records, cached...
        // TODO: Change this to a transaction group record?, can keep the total, etc on there, rather than just an array and totals in the cache if needed ?
        // TODO: Also, technically, this shouldn't be in the cache. it can be well defined here and is always available...
        let transactions = new Array<TransactionRecord>();

        for (let i = 0; i < this.amounts.length; i++) {
            let t = new TransactionRecord();
            t.id = this.id * 100000 + i;
            t.amount = this.amounts[i].amount;
            t.date = this.date;
            t.description = this.description;  
            t.categoryId = this.amounts[i].categoryId;
            //t.accountId = this.amounts[i].accountId;
            t.x.transactions = transactions;
            //t.status = this.amounts[i].status || this.status;

            transactions.push(t);
            table.insert(t);        
            tp.mapTransactionAndRecord(this, t);
        }

        if (this.accountAmounts) for (let i = 0; i < this.accountAmounts.length; i++) {
            
        }
        
    }

    update(tp: TransactionProcessor) {
        // Just remove everything and add it all again
        // TODO: This won't handle triggering certain category recalcs (but at the moment that doesn't matter...)

        this.undo(tp);
        this.apply(tp);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);

        tp.findAllRecordsForTransaction(this).slice().forEach((t) => {            
            table.remove(<TransactionRecord> t);
            tp.unmapTransactionAndRecord(this, t);
        });
    }

    
    deserialize(field: string, value: any): any {
        if (field === 'amounts') {
            value.forEach(line => {
                line.amount = new Big(line.amount);
            });
        }
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        let total = env.currencyFormatter(this.amounts.map((l) => l.amount).reduce((a, b) => a.plus(b)));
        if (env.action === 'apply') {
            return "Added " + this.description + " of " + total;
        } else if (env.action === 'update') {
            return "Updated " + this.description + " to " + total;
        } else {
            return "Deleted " + this.description + " of " + total;
        } 
    }


}

