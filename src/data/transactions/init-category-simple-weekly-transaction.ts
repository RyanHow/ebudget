import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Category} from '../records/category';
import {CategorySimpleWeeklyProcessor} from '../processors/category-simple-weekly-processor';
import {Logger} from '../../services/logger';
import { Big } from 'big.js';

export class InitCategorySimpleWeeklyTransaction extends DbTransaction {

    private static logger: Logger = Logger.get('InitCategorySimpleWeeklyTransaction');

    categoryId: number;
    balanceDate: string;
    balance: Big;
    weeklyAmount: Big;

    getTypeId(): string {
        return 'InitCategorySimpleWeeklyTransaction';
    }


    apply(tp: TransactionProcessor) {
        
        // TODO: Validation
        
        let table = tp.table(Category);
        let categoryRecord = table.by('id', <any> this.categoryId);
        if (categoryRecord == null) {
            InitCategorySimpleWeeklyTransaction.logger.info('Trying to processing category weekly transaction with invalid category. Skipping.');
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
        
        tp.mapTransactionAndRecord(this, categoryRecord);

        // TODO: engine.execute ?? - needs to be called from elsewhere so it can be batched... but maybe have to fire an event here ?
    }

    update(tp: TransactionProcessor) {
        this.undo(tp); // TODO: This will not handle a change in category (And maybe it shouldn't need to, but we need to verify it wasn't changed). it should undo the previous version of this transaction...
        this.apply(tp);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(Category);
        let categoryRecord = table.by('id', <any> this.categoryId);

        if (categoryRecord == null) {
            InitCategorySimpleWeeklyTransaction.logger.info('Trying to processing category weekly transaction with invalid category. Skipping.');
            return;
        }

        // TODO: A better method of finding, or some centralised methods in engine rather than using the processors array directly...
        let categorySimpleWeeklyProcessor = categoryRecord.engine.processors.find(processor => {
            return processor.getTypeId() === 'CategorySimpleWeeklyProcessor' && (<CategorySimpleWeeklyProcessor> processor).transactionId === this.id;
        });
        
        categoryRecord.engine.processors.splice(categoryRecord.engine.processors.indexOf(categorySimpleWeeklyProcessor), 1);
        
        table.update(categoryRecord);
    }
    
    deserialize(field: string, value: any): any {
        if (field === 'balance')
            return new Big(value);
        if (field === 'weeklyAmount')
            return new Big(value);
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        if (env.action === 'apply') {
            return "set {{category name}} to " + env.currencyFormatter(this.weeklyAmount) + " per week";
        } else if (env.action === 'update') {
            return "updated {{category name}} to " + env.currencyFormatter(this.weeklyAmount) + " per week";
        } else {
            return "removed weekly amount of " + env.currencyFormatter(this.weeklyAmount) + " from category {{category name}}";
        } 
    }

}

