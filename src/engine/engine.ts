import {Db} from '../db/db';
import {Record} from '../db/record';
import {Category} from '../data/records/category';
import {Account} from '../data/records/account';
import {Notifications} from '../services/notifications';
import { Configuration } from '../services/configuration-service';
import { Transaction } from "../data/records/transaction";

export class Engine {

    categorySortedAlphabeticalDynamicView: LokiDynamicView<Category>;
    transactionUnreconciledDynamicView: LokiDynamicView<Transaction>;

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

        this.transactionUnreconciledDynamicView = this.db.transactionProcessor.table(Transaction).addDynamicView("TransactionUnreconciled");
        this.transactionUnreconciledDynamicView.applyWhere(t => !t.x.reconciled);
        this.transactionUnreconciledDynamicView.applySimpleSort('date', true);

    }
    
    runAllProcessors() {
        this.db.transactionProcessor.table(Category).data.forEach(category => {
           category.engine.processors.forEach(processor => {
              processor.execute(this.db.transactionProcessor);
           });
        });
        this.db.transactionProcessor.table(Account).data.forEach(account => {
           account.processors.forEach(processor => {
              processor.execute(this.db.transactionProcessor);
           });
        });
    }

    getCategories(order: "alphabetical" | "natural" = "natural"): Array<Category> {
        
        if (order == "alphabetical") return this.categorySortedAlphabeticalDynamicView.data();
        return this.db.transactionProcessor.table(Category).chain().data();
    }

    getTransactionsUnreconciledView() {
        return this.transactionUnreconciledDynamicView;
    }

    getCategory(categoryId: any): Category {
        return this.db.transactionProcessor.table(Category).by('id', categoryId);
    }

    getAccounts(): Account[] {
        return this.db.transactionProcessor.table(Account).chain().simplesort('name').data();
    }

    getRecordById<T extends Record<any>>(type: {new(): T}, id: any): T {
        return this.db.transactionProcessor.table(type).by('id', id);
    }

}