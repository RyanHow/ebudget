import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {Transaction as TransactionRecord} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import { Big } from 'big.js';


/**
 * @deprecated Use CreateSplitTransaction. This is here for legacy purposes
 */
export class InitSimpleTransaction extends DbTransaction {

    description: string;
    date: string;
    amount: Big;
    categoryId: number;

    getTypeId(): string {
        return 'InitSimpleTransaction';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(TransactionRecord);
        let t = new TransactionRecord();
        t.id = this.id * 100000;
        t.amount = this.amount;
        t.date = this.date;
        t.description = this.description;
        t.categoryId = this.categoryId;
                
        table.insert(t);        

        tp.mapTransactionAndRecord(this, t);
    }

    update(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);
        let t = table.by('id', <any> (this.id * 100000));
        t.amount = this.amount;
        t.date = this.date;
        t.description = this.description;
        t.categoryId = this.categoryId;
        table.update(t);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);
        let c = table.by('id', <any> (this.id * 100000));
        table.remove(c);
    }
    
    deserialize(field: string, value: any): any {
        if (field === 'amount')
            return new Big(value);
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        let total = env.currencyFormatter(this.amount);
        if (env.action === 'apply') {
            return this.description + " of " + total;
        } else if (env.action === 'update') {
            return this.description + " to " + total;
        } else {
            return this.description + " of " + total;
        } 
    }


}

