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
    }>;

    getTypeId(): string {
        return 'CreateSplitTransaction';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(TransactionRecord);

        for (let i = 0; i < this.amounts.length; i++) {
            let t = new TransactionRecord();
            t.id = this.id * 100000 + i;
            t.amount = this.amounts[0].amount;
            t.date = this.date;
            t.description = this.description;
            t.categoryId = this.amounts[0].categoryId;

            //TODO: Store other transactions rather than relying on the "transaction";
            
            table.insert(t);        
            tp.mapTransactionAndRecord(this, t);
        }
        
    }

    update(tp: TransactionProcessor) {
        tp.unsupported();

        // TODO: Remove and add records and mappings as appropriate
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(TransactionRecord);

        tp.findAllRecordsForTransaction(this).forEach((t) => {
            table.remove(<TransactionRecord> t);
        });
    }

    
    deserialize(field: string, value: any): any {
        if (field === 'amount')
            return new Big(value);
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        let total = env.currencyFormatter(this.amounts.map((l) => l.amount).reduce((a, b) => a.plus(b)));
        if (env.action === 'apply') {
            return this.description + " of " + total;
        } else if (env.action === 'update') {
            return this.description + " to " + total;
        } else {
            return this.description + " of " + total;
        } 
    }


}

