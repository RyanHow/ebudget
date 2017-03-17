import {Db} from '../db/db';
import {Category} from '../data/records/category';

export class Engine {
    
    constructor(public db: Db) {
        db.addEventListener(dbEvent => {
            if (dbEvent.db && dbEvent.db.isBatchProcessing()) {
                // Only process at batch end...
            } else {
                if (dbEvent.eventName === 'transaction-batch-end') this.runAll();
                if (dbEvent.eventName === 'transaction-applied') this.runAll();
                if (dbEvent.eventName === 'transaction-undone') this.runAll();
            }
        });
        
    }
    
    runAll() {
        this.db.transactionProcessor.table(Category).data.forEach(category => {
           category.engine.processors.forEach(processor => {
              processor.execute(this.db.transactionProcessor);
           });
        });
    }
}