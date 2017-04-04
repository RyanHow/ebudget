import {Db} from '../db/db';
import {Category} from '../data/records/category';
import {Notifications} from '../services/notifications';
import {Configuration} from '../services/configuration-service';

export class Engine {

    categorySortedAlphabeticalDynamicView: LokiDynamicView<Category>;

    constructor(public db: Db, notifications: Notifications, configuration: Configuration) {
        db.addEventListener(dbEvent => {
            if (dbEvent.db && dbEvent.db.isBatchProcessing()) {
                // Only process at batch end, which isBatchProcessing is false
            } else {
                let message: string;
                if (dbEvent.eventName === 'transaction-batch-end') this.runAllProcessors();
                if (dbEvent.eventName === 'transaction-applied') {
                    this.runAllProcessors();
                    message = dbEvent.data.transaction.toHumanisedString({action: dbEvent.data.update ? 'update' : 'apply', currencyFormatter: notifications.formatCurrency, originalTransaction: dbEvent.data.originalTransaction});
                }
                if (dbEvent.eventName === 'transaction-undone') {
                    message = dbEvent.data.transaction.toHumanisedString({action: 'undo', currencyFormatter: notifications.formatCurrency});
                    this.runAllProcessors();
                } 

                // TODO: Move this out of the engine and into another listener
                if (message && configuration.option('experimental.transaction.notifications')) {
                    notifications.notify(message, true, dbEvent.data.transaction && dbEvent.db.transactionIdLocalGen() === dbEvent.db.extractTransactionLocalGenId(dbEvent.data.transaction.id), false);

                }
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

    getCategory(categoryId: any): Category {
        return this.db.transactionProcessor.table(Category).by('id', categoryId);
    }

}