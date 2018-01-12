import {DbPersistenceProvider} from './db-persistence-provider';
import {Dbms} from './dbms';
import {DbTransaction} from './transaction';
import {TransactionProcessor} from './transaction-processor';
import {TransactionSerializer} from './transaction-serializer';
import {Logger} from '../services/logger';
import {ChunkedTask} from '../services/chunked-task';
import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";

type DbEventType = 'transaction-applied' | 'transaction-undone' | 'db-activated' | 'db-deleted' | 'transaction-batch-start' | 'transaction-batch-end';

export interface DbEvent {
    eventName: DbEventType;
    data?: {transaction?: DbTransaction, update?: boolean, originalTransaction?: DbTransaction};
    db?: Db;
}

export interface DbEventListener {
    (dbEvent: DbEvent): void;
}

export class Db {
    private dbTransactionEventsObserver: Subscriber<DbEvent>;
    private dbTransactionEventsObservable: Observable<DbEvent>;
    private dbEventsObservable: Observable<DbEvent>;
    private dbEventsObserver: Subscriber<DbEvent>;

    private logger: Logger = Logger.get('Db');

    private transactions: LokiCollection<DbTransaction>;
    public sortedTransactions: LokiDynamicView<DbTransaction>;
    private active: boolean;
    private batchProcessing: boolean;
    private initialised: boolean;
    private activating: boolean;
    private transactionIdHead: number;
    private eventListeners: Array<DbEventListener>;
    transactionProcessor: TransactionProcessor;

    toJSON() {
        return this.id;
    }

    constructor(public id: string, public dbms: Dbms , private persistenceProvider: DbPersistenceProvider, private loki: Loki, private transactionSerializer: TransactionSerializer) {
        this.active = false;
        this.initialised = false;
        this.transactionProcessor = new TransactionProcessor(this, this.loki);
        
        this.transactions = this.loki.addCollection<DbTransaction>('transactions_' + this.id);
        this.transactions.ensureUniqueIndex('id');
        this.eventListeners = [];

        this.dbEventsObservable = new Observable<DbEvent>(observer => this.dbEventsObserver = observer).share();
        this.dbTransactionEventsObservable = new Observable<DbEvent>(observer => this.dbTransactionEventsObserver = observer).share();
        
    }

    init(): Promise<void> {
        return this.persistenceProvider.transactions(this.id).then(dbtransactions => {
            dbtransactions.forEach((transaction) => {
                this.transactions.insert(transaction);
            });
            this.sortedTransactions = this.transactions.addDynamicView('sortedTransactions_' + this.id);
            this.sortedTransactions.applySimpleSort('id');
            this.initialised = true;
        });
    }
    
    isActive(): boolean {
        return this.active;
    }

    isBatchProcessing(): boolean {
        return this.batchProcessing;
    }
    
    activate(progressCallback?: (value: number, of: number) => void): Promise<void> {
        // If already active, then skip and return straight away
        if (this.active) return Promise.resolve();

        this.logger.info("Activating Budget " + this.name());

        if (!this.initialised) throw new Error('Activate called when not yet initialised.');

        if (this.activating) {
            this.logger.info("Budget Already Activating " + this.name());
            return Promise.resolve();
        }
        
        this.activating = true;
        this.batchProcessing = true;
        this.fireEvent({eventName: 'transaction-batch-start'});

        let p = ChunkedTask.execute((iterator, resolve, reject) => {
            // Can update this to just pass in the array... Put it in the initialiser...
            // Or: Can move the: "Size" to a property and just have a single statement here...
            if (iterator.getValue() === 0) {
                // To handle when the array is empty
                if (this.sortedTransactions.data().length == 0) {
                    resolve();
                    return;
                }
                iterator.setExpectedSize(this.sortedTransactions.data().length);
            }
            this.applyTransaction(this.sortedTransactions.data()[iterator.getValue()]);
            if (iterator.getValue() == this.sortedTransactions.data().length - 1) resolve();
        }, {progressCallback: progressCallback}).then(() => {
            this.activating = false;
            this.active = true;
            this.logger.info("Activated Budget " + this.name());                
            this.fireEvent({eventName: 'db-activated'});
            this.batchProcessing = false;
            this.fireEvent({eventName: 'transaction-batch-end'});
        }).catch(reason => {
            this.activating = false;
            this.active = false;
            this.batchProcessing = false;
            this.logger.error("Error activating db", reason, reason.stack);
        });

        return p;
    }
    
    isActivating() {
        return this.activating;
    }
    
    deactivate() {
        if (! this.active) return;
        
        // TODO: Delete tables (not transactions, but generated tables)
        this.active = false;
    }

    name(name?: string): string {
        return this.localSetting('name', name);
    }
    
    transactionIdLocalGen(localGenId?: any): number {
        var id = this.localSetting('localGenId', localGenId);
        if (!id) return 1;
        if (parseInt(id) < 1 || parseInt(id) > 999) throw new Error('localGenId must be between 1 - 999 inclusive. Value is: ' + localGenId);
        return parseInt(id);
    }

    localSetting(key: string, valueString?: string): string {
        return this.persistenceProvider.keyStore(this.id, key, valueString);
    }
    
    // Returns the next transaction Id above the head transaction (So does not increment, incrementing occurs on processing)
    nextTransactionId() {
        return ~~((~~((this.transactionIdHead ? this.transactionIdHead : 0) / 1000) + 1) * 1000) + this.transactionIdLocalGen();
    }

    extractTransactionLocalGenId(transactionId: number): number {
        return transactionId % 1000;
    }

    private updateTransactionIdHead(transaction: DbTransaction) {
        if (!this.transactionIdHead || transaction.id > this.transactionIdHead) this.transactionIdHead = transaction.id;
    }
    
    /**
     * Applying a transaction will execute it and persist it in the database.
     * 
     * The transaction must be a new one, or attached to a database, not a clone
     */
    applyTransaction(transaction: DbTransaction) {

        try {

            // Updated works like the following:-
            // If active, then it is updated if a transaction is already applied
            // If inactive, then it is updated if a transaction is already in the database
            // In both cases, the previous version is fetched from the database, to be passed to the event
            // In the already active case, the previous version is also passed to the transaction update (although it could also collect info from the "records")
            let updated = false;
            let updatedOriginalTransaction: DbTransaction;

            if (transaction.id) this.updateTransactionIdHead(transaction);
            
            // Ignore deleted transactions
            if (transaction.deleted) {
                if (! transaction.id) {
                    // Ignore this, it's been deleted and never persisted...
                    return;
                } else if (!transaction.applied) {
                    // If it's not applied and it's deleted, that is the final state we want for the transaction, so lets leave it here...
                    // Save the transaction still unless we are activating
                    if (!this.activating) this.deleteTransaction(transaction);
                    return;
                } else {
                    // It's deleted AND applied, so we need to processes the deletion
                    this.deleteTransaction(transaction);
                    // Transaction applied is called in delete...
                    return;
                }
            } else {
                // Give a new transaction an Id

                if (!transaction.id) {
                    transaction.id = this.nextTransactionId();
                    this.updateTransactionIdHead(transaction);
                }
                
                // Process transactions
                if (this.active || this.activating) {
                    if (!transaction.applied) {
                        try {
                            transaction.apply(this.transactionProcessor);
                        } catch (err) {
                            this.logger.info("Error applying transaction: Transaction info: " + JSON.stringify(transaction));
                            throw err;
                        }
                        transaction.applied = true;
                        
                    } else {
                        updated = true;
                        updatedOriginalTransaction = this.persistenceProvider.getTransaction(this.id, transaction.id); 
                        try {
                            transaction.update(this.transactionProcessor, updatedOriginalTransaction);
                        } catch (err) {
                            this.logger.info("Error updating transaction: Transaction info: " + JSON.stringify(transaction));
                            throw err;
                        }
                    }
                }
                if (!this.activating) {
                    updated = updated || (!this.active && (<any>transaction).$loki != null);
                    if (updated && !updatedOriginalTransaction) updatedOriginalTransaction = this.persistenceProvider.getTransaction(this.id, transaction.id);
                    this.saveTransaction(transaction);
                }
            }

            this.fireEvent({eventName : 'transaction-applied', data: {transaction: transaction, update: updated, originalTransaction: updatedOriginalTransaction}});
        } catch (err) {
            this.logger.info("Error applying transaction. Throwing Error.", transaction, err);
            throw err;
        }
    }
    
    getTransaction<T extends DbTransaction>(transactionId: number): T {
        return <T>this.transactions.by('id', <any> transactionId);
    }
    
    /**
     * Saving a transaction will persist it, but not apply it
     * This should only be called internally, or if extra transaction
     * data is needing to be saved without any modifications to the transaction itself
     * 
     * The transaction must be a new one, or attached to a database, not a clone
     */
    saveTransaction(transaction: DbTransaction) {
        // Determine which one... it doesn't matter
        if (this.getTransaction(transaction.id) == null) {
            this.transactions.insert(transaction);
        } else {
            this.transactions.update(transaction);
        }
        
        this.persistenceProvider.saveTransaction(this.id, this.transactionSerializer.cloneTransaction(transaction));
    }
        
    /**
     * Undo a transaction and remove it from the database
     */
    deleteTransaction(transaction: DbTransaction) {
        transaction.deleted = true;
        if (this.getTransaction(transaction.id) == null) {
            this.transactions.insert(transaction);
        } else {
            this.transactions.update(transaction);
        }

        this.persistenceProvider.saveTransaction(this.id, this.transactionSerializer.cloneTransaction(transaction));
        this.undoTransaction(transaction);
    }
    
    undoTransaction(transaction: DbTransaction) {
        if (!transaction.applied) return;
        try {
            transaction.undo(this.transactionProcessor);
        } catch (err) {
            this.logger.info("Error undoing transaction: Transaction info: " + JSON.stringify(transaction));
            throw err;
        }
        transaction.applied = false;
        this.fireEvent({eventName: 'transaction-undone', data: {transaction: transaction}});
    }
    
    
    
    addEventListener(listener: DbEventListener) {
        this.eventListeners.push(listener);
    }

    on(event: DbEventType): Observable<DbEvent> {
        if (event === 'db-activated' || event === 'db-deleted') return this.dbEventsObservable.filter(dbEvent => dbEvent.eventName === event);
        return this.dbTransactionEventsObservable.filter(dbEvent => dbEvent.eventName === event);
    }
    
    deleteInternal() {
        this.fireEvent({eventName: 'db-deleted'});
        this.eventListeners.length = 0;
    }

    fireEvent(dbEvent: DbEvent) {
        if (!dbEvent.db) dbEvent.db = this;

        this.logger.debug(() => dbEvent);
        this.eventListeners.forEach((listener) => {listener(dbEvent)});
        if (this.dbEventsObserver && dbEvent.eventName === 'db-activated' || dbEvent.eventName === 'db-deleted') this.dbEventsObserver.next(dbEvent);
        else if (this.dbTransactionEventsObserver) this.dbTransactionEventsObserver.next(dbEvent);
    }


}