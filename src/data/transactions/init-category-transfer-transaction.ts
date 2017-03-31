import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {Transaction as TransactionRecord} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import Big from 'big.js';


export class InitCategoryTransferTransaction extends DbTransaction {

    description: string;
    date: string;
    amount: BigJsLibrary.BigJS;
    fromCategoryId: number;
    toCategoryId: number;

    getTypeId(): string {
        return 'InitCategoryTransferTransaction';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(TransactionRecord);
        let t1 = new TransactionRecord();
        let t2 = new TransactionRecord();
        t1.id = this.id * 100000;
        t2.id = -this.id * 100000;
        t1.amount = this.amount;
        t2.amount = this.amount.times('-1');
        t1.date = this.date;
        t2.date = this.date;
        t1.description = this.description ? this.description : 'Transfer';
        t2.description = this.description ? this.description : 'Transfer';
        t1.x.type = "Transfer"; // TODO: By convention the type shouldn't be in the cache...
        t2.x.type = "Transfer";
        t1.x.transfer = t2; // TODO: By convention the linked transfer shouldn't be in the cache...
        t2.x.transfer = t1;
        t1.categoryId = this.fromCategoryId;
        t2.categoryId = this.toCategoryId;

        table.insert(t1);        
        table.insert(t2);        

        tp.mapTransactionAndRecord(this, t1);
        tp.mapTransactionAndRecord(this, t2);
    }

    update(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);
        let t1 = table.by('id', <any> (this.id * 100000));
        let t2 = table.by('id', <any> -(this.id * 100000));

        t1.amount = this.amount;
        t2.amount = this.amount.times('-1');
        t1.date = this.date;
        t2.date = this.date;
        t1.description = this.description;
        t2.description = this.description;
        t1.categoryId = this.fromCategoryId;
        t2.categoryId = this.toCategoryId;

        table.update(t1);
        table.update(t2);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);
        let t1 = table.by('id', <any> (this.id * 100000));
        let t2 = table.by('id', <any> -(this.id * 100000));
        
        table.remove(t1);
        table.remove(t2);
    }

    deserialize(field: string, value: any): any {
        if (field === 'amount')
            return new Big(value);
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        let total = env.currencyFormatter(this.amount);
        if (env.action === 'apply') {
            return "transferred " + total + " from a to b";
        } else if (env.action === 'update') {
            return "ammended transfer from a to b " + " to " + total; // TODO: What aspect was updated ?
        } else {
            return this.description + " of " + total;
        } 
    }

}

