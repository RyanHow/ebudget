import {Transaction} from '../../db/transaction';
import {Transaction as TransactionRecord} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Db} from '../../db/db';
import Big from 'big.js';


export class InitSimpleTransaction extends Transaction {

    description: string;
    date: string;
    amount: BigJsLibrary.BigJS;
    categoryId: number;

    getTypeId(): string {
        return 'InitSimpleTransaction';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(TransactionRecord);
        let t = new TransactionRecord();
        t.id = this.id;
        t.amount = this.amount;
        t.date = this.date;
        t.description = this.description;
        t.categoryId = this.categoryId;
        
        t.config.transactionType = this.getTypeId();
        
        table.insert(t);        
    }

    update(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);
        let t = table.by('id', <any> this.id);
        t.amount = this.amount;
        t.date = this.date;
        t.description = this.description;
        t.categoryId = this.categoryId;
        table.update(t);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);
        let c = table.by('id', <any> this.id);
        table.remove(c);
    }

    static getFrom(db: Db, transactionRecord: TransactionRecord): InitSimpleTransaction {
        return db.getTransaction<InitSimpleTransaction>(transactionRecord.id);
    }
    
    deserialize(field: string, value: any): any {
        if (field === 'amount')
            return new Big(value);
        return value;
    }

}

