import {Db} from '../db/db';
import {Category} from '../data/records/category';

export class Engine {
    
    constructor(public db: Db) {
        db.addEventListener(eventName => {
            if (eventName === 'transaction-applied') this.runAll();
            if (eventName === 'transaction-undone') this.runAll();
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