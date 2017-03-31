import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Budget} from '../records/budget';

export class InitBudgetTransaction extends DbTransaction {

    budgetName: string;    

    getTypeId(): string {
        return 'InitBudgetTransaction';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let budget = tp.single(Budget);
        budget.name = this.budgetName;
        tp.table(Budget).update(budget);
        tp.db.name(this.budgetName);

        tp.mapTransactionAndRecord(this, budget);

    }

    update(tp: TransactionProcessor) {
        this.apply(tp);
    }
    
    undo(tp: TransactionProcessor) {
        tp.unsupported();
    }


    deserialize(field: string, value: any): any {
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        return /*Created / Updated / Deleted */ "budget " + this.budgetName;
    }

}