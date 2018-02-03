import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {Transaction as TransactionRecord} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import { Big } from 'big.js';


/**
 * @deprecated Use CreateSplitTransaction with 2 amounts that total in 0
 */
export class CreateSplitTransfer extends DbTransaction {

    description: string;
    date: string;
    categoryId: number;
    accountId?: number;
    accountId2?: number;
    amounts: Array<{
        amount: Big;
        categoryId: number;
    }>;


    getTypeId(): string {
        return 'CreateSplitTransfer';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation
        // TODO: If multiple accounts, then only a single amount & category

        let table = tp.table(TransactionRecord);
        
        let transactions = new Array<TransactionRecord>();

        let total = new Big('0');

        let description = this.description == null || this.description.trim().length == 0 ? 'Transfer' : this.description;

        for (let i = 0; i < this.amounts.length; i++) {
            let t = new TransactionRecord();
            t.id = this.id * 100000 + i + 1;
            t.amount = this.amounts[i].amount;
            total = total.plus(t.amount);
            t.date = this.date;
            t.description = description;
            t.categoryId = this.amounts[i].categoryId;
            t.accountId = this.accountId2 || this.accountId;
            t.x.transactions = transactions;
            t.x.type = "Transfer"; // TODO: By convention the type shouldn't be in the cache?
            transactions.push(t);
            table.insert(t);        
            tp.mapTransactionAndRecord(this, t);
        }

        let t = new TransactionRecord();
        t.id = this.id * 100000;
        t.amount = total.times(-1);
        t.date = this.date;
        t.description = description;
        t.categoryId = this.categoryId;
        t.accountId = this.accountId;
        t.x.transactions = transactions;
        t.x.type = "Transfer";
        transactions.push(t);
        table.insert(t);        
        tp.mapTransactionAndRecord(this, t);

        
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

