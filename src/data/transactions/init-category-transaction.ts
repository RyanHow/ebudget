import {Transaction} from '../../db/transaction';
import {Db} from '../../db/db';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Category} from '../records/category';


export class InitCategoryTransaction extends Transaction {

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

    static getFrom(db: Db, category: Category): InitCategoryTransaction {
        return db.getTransaction<InitCategoryTransaction>(category.id);
    }
    
    deserialize(field: string, value: any): any {
        return value;
    }

}

