import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Category} from '../records/category';


export class InitCategoryTransaction extends DbTransaction {

    categoryName: string;    

    getTypeId(): string {
        return 'InitCategoryTransaction';
    }


    apply(tp: TransactionProcessor) {
        
        // TODO: Validation
        
        let table = tp.table(Category);
        let c = new Category();
        c.id = this.id;
        c.name = this.categoryName;

        table.insert(c);
        tp.mapTransactionAndRecord(this, c);
    }

    update(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(Category);
        let c = table.by('id', <any> this.id);
        c.name = this.categoryName;
        table.update(c);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(Category);
        let c = table.by('id', <any> this.id);
        table.remove(c);
    }
    
    deserialize(field: string, value: any): any {
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        if (env.action === 'apply') {
            return "created category " + this.categoryName;
        } else if (env.action === 'update') {
            return "renamed category {{old name}} to " + this.categoryName;
        } else {
            return "removed category " + this.categoryName;
        } 
    }

}

