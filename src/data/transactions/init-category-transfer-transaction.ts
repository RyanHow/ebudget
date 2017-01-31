import {Transaction} from '../../db/transaction';
import {Transaction as TransactionRecord} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Db} from '../../db/db';
import Big from 'big.js';


export class InitCategoryTransferTransaction extends Transaction {

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
        t1.id = this.id;
        t2.id = -this.id;
        t1.amount = this.amount;
        t2.amount = this.amount.times('-1');
        t1.date = this.date;
        t2.date = this.date;
        t1.description = this.description ? this.description : 'Transfer';
        t2.description = this.description ? this.description : 'Transfer';
        t1.categoryId = this.fromCategoryId;
        t2.categoryId = this.toCategoryId;

        t1.config.transactionType = this.getTypeId();
        t2.config.transactionType = this.getTypeId();

        table.insert(t1);        
        table.insert(t2);        
    }

    update(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);
        let t1 = table.by('id', <any> this.id);
        let t2 = table.by('id', <any> -this.id);

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
        let t1 = table.by('id', <any> this.id);
        let t2 = table.by('id', <any> -this.id);
        
        table.remove(t1);
        table.remove(t2);
    }

    static getFrom(db: Db, transactionRecord: TransactionRecord): InitCategoryTransferTransaction {
        // TODO: A better "resolver" system ?
        return db.getTransaction<InitCategoryTransferTransaction>(transactionRecord.id < 0 ? -transactionRecord.id : transactionRecord.id);
    }

    deserialize(field: string, value: any): any {
        if (field === 'amount')
            return new Big(value);
        return value;
    }

}

