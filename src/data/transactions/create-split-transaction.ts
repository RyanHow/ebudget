import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {Transaction as TransactionRecord} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import Big from 'big.js';


export class CreateSplitTransaction extends DbTransaction {

    description: string;
    date: string;
    amounts: Array<{
        amount: BigJsLibrary.BigJS;
        categoryId: number;
        accountId?: number;
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
            t.accountId = this.amounts[i].accountId;
            t.x.transactions = transactions;

            transactions.push(t);
            table.insert(t);        
            tp.mapTransactionAndRecord(this, t);
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

