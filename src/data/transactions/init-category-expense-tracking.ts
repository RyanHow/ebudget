import {Transaction} from '../../db/transaction';
import {Db} from '../../db/db';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Category} from '../records/category';
import {CategorySimpleWeeklyProcessor} from '../processors/category-simple-weekly-processor';
import {Logger} from '../../services/logger';
import Big from 'big.js';

export class InitCategoryExpenseTracking extends Transaction {

    private static logger: Logger = Logger.get('InitCategoryExpenseTracking');

    categoryId: number;
    balanceDate: string;
    balance: BigJsLibrary.BigJS;
    weeklyAmount: BigJsLibrary.BigJS;

    getTypeId(): string {
        return 'InitCategoryExpenseTracking';
    }


    apply(tp: TransactionProcessor) {
        
        // TODO: Validation
        
        let table = tp.table(Category);
        let categoryRecord = table.by('id', <any> this.categoryId);
        if (categoryRecord == null) {
            InitCategoryExpenseTracking.logger.info('Trying to processing category weekly transaction with invalid category. Skipping.');
            return;
        }
        let processor = new CategorySimpleWeeklyProcessor();
        processor.balance = this.balance;
        processor.weeklyAmount = this.weeklyAmount;
        processor.balanceDate = this.balanceDate;
        processor.category = categoryRecord;
        processor.transactionId = this.id;
        
        categoryRecord.engine.processors.push(processor);

        table.update(categoryRecord);
        
        // TODO: engine.execute ?? - needs to be called from elsewhere so it can be batched... but maybe have to fire an event here ?
    }

    update(tp: TransactionProcessor) {
        this.undo(tp);
        this.apply(tp);        
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(Category);
        let categoryRecord = table.by('id', <any> this.categoryId);

        if (categoryRecord == null) {
            InitCategoryExpenseTracking.logger.info('Trying to processing category weekly transaction with invalid category. Skipping.');
            return;
        }

        // TODO: A better method of finding, or some centralised methods in engine rather than using the processors array directly...
        let categorySimpleWeeklyProcessor = categoryRecord.engine.processors.find(processor => {
            return processor.getTypeId() === 'CategorySimpleWeeklyProcessor' && (<CategorySimpleWeeklyProcessor> processor).transactionId === this.id;
        });
        
        categoryRecord.engine.processors.splice(categoryRecord.engine.processors.indexOf(categorySimpleWeeklyProcessor), 1);
        
        table.update(categoryRecord);
    }

    static getFrom(db: Db, category: Category): InitCategoryExpenseTracking {
        let categorySimpleWeeklyProcessor = <CategorySimpleWeeklyProcessor>category.engine.processors.find(processor => {
            return processor.getTypeId() === 'CategorySimpleWeeklyProcessor';
        });

        if (!categorySimpleWeeklyProcessor) return;
        return db.getTransaction<InitCategoryExpenseTracking>((categorySimpleWeeklyProcessor).transactionId);
    }
    
    deserialize(field: string, value: any): any {
        if (field === 'balance')
            return new Big(value);
        if (field === 'weeklyAmount')
            return new Big(value);
        return value;
    }

}

