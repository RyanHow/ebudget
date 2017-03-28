import {Db} from '../db/db';
import {Category} from '../data/records/category';

export class Engine {

    categorySortedAlphabeticalDynamicView: LokiDynamicView<Category>;

    constructor(public db: Db) {
        db.addEventListener(dbEvent => {
            if (dbEvent.db && dbEvent.db.isBatchProcessing()) {
                // Only process at batch end, which isBatchProcessing is false
            } else {
                if (dbEvent.eventName === 'transaction-batch-end') this.runAllProcessors();
                if (dbEvent.eventName === 'transaction-applied') this.runAllProcessors();
                if (dbEvent.eventName === 'transaction-undone') this.runAllProcessors();
            }
        });
        
        this.categorySortedAlphabeticalDynamicView = this.db.transactionProcessor.table(Category).addDynamicView("CategorySortedAlphabetical");
        this.categorySortedAlphabeticalDynamicView.applySort(((a, b) => (a.name+''.toLocaleLowerCase()).localeCompare(b.name+''.toLocaleLowerCase())));
    }
    
    runAllProcessors() {
        this.db.transactionProcessor.table(Category).data.forEach(category => {
           category.engine.processors.forEach(processor => {
              processor.execute(this.db.transactionProcessor);
           });
        });
    }

    getCategories(order: "alphabetical" | "natural" = "natural"): Array<Category> {
        
        if (order == "alphabetical") return this.categorySortedAlphabeticalDynamicView.data();
        return this.db.transactionProcessor.table(Category).chain().data();
    }

}