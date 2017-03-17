import {DbPersistenceProvider} from './db-persistence-provider';
import {Dbms} from './dbms';
import {Transaction} from './transaction';
import {TransactionProcessor} from './transaction-processor';
import {TransactionSerializer} from './transaction-serializer';
import {Logger} from '../services/logger';
import {ChunkedTask} from '../services/chunked-task';

export interface DbEvent {
    eventName: 'transaction-applied' | 'transaction-undone' | 'db-activated' | 'db-deleted' | 'transaction-batch-start' | 'transaction-batch-end';
    data?: {transaction?: Transaction, transactions?: Array<Transaction>};
    db?: Db;
}

export interface DbEventListener {
    (dbEvent: DbEvent): void;
}

export class Db {

    private logger: Logger = Logger.get('Db');

    private transactions: LokiCollection<Transaction>;
    public sortedTransactions: LokiDynamicView<Transaction>;
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

    constructor(public id: string, private dbms: Dbms , private persistenceProvider: DbPersistenceProvider, private loki: Loki, private transactionSerializer: TransactionSerializer) {
        this.active = false;
        this.initialised = false;
        this.transactionProcessor = new TransactionProcessor(this, this.loki);
        
        this.transactions = this.loki.addCollection<Transaction>('transactions_' + this.id);
        this.transactions.ensureUniqueIndex('id');
        this.eventListeners = [];
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
            this.logger.error("Error activating db", reason);
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

    private updateTransactionIdHead(transaction: Transaction) {
        if (!this.transactionIdHead || transaction.id > this.transactionIdHead) this.transactionIdHead = transaction.id;
    }
    
    /**
     * Applying a transaction will execute it and persist it in the database.
     * 
     * The transaction must be a new one, or attached to a database, not a clone
     */
    applyTransaction(transaction: Transaction) {

        try {

            if (transaction.id) this.updateTransactionIdHead(transaction);
            
            // Ignore deleted transactions
            if (transaction.deleted) {
                if (! transaction.id) {
                    // Ignore this, it's been deleted and never persisted...
                    return;
                } else if (!transaction.applied) {
                    // If it's not applied and it's deleted, that is the final state we want for the transaction, so lets leave it here...
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
                        transaction.apply(this.transactionProcessor);
                        transaction.applied = true;
                        
                    } else {
                        transaction.update(this.transactionProcessor);
                    }
                }
                if (!this.activating) {
                    this.saveTransaction(transaction);
                }
            }

            this.fireEvent({eventName : 'transaction-applied', data: {transaction: transaction}});
        } catch (err) {
            this.logger.info("Error applying transaction. Throwing Error.", transaction, err);
            throw err;
        }
    }
    
    getTransaction<T extends Transaction>(transactionId: number): T {
        return <T>this.transactions.by('id', <any> transactionId);
    }
    
    /**
     * Saving a transaction will persist it, but not apply it
     * This should only be called internally, or if extra transaction
     * data is needing to be saved without any modifications to the transaction itself
     * 
     * The transaction must be a new one, or attached to a database, not a clone
     */
    saveTransaction(transaction: Transaction) {
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
    deleteTransaction(transaction: Transaction) {
        transaction.deleted = true;
        if (this.getTransaction(transaction.id) == null) {
            this.transactions.insert(transaction);
        } else {
            this.transactions.update(transaction);
        }

        this.persistenceProvider.saveTransaction(this.id, this.transactionSerializer.cloneTransaction(transaction));
        this.undoTransaction(transaction);
    }
    
    undoTransaction(transaction: Transaction) {
        if (!transaction.applied) return;
        transaction.undo(this.transactionProcessor);
        transaction.applied = false;
        this.fireEvent({eventName: 'transaction-undone', data: {transaction: transaction}});
    }
    
    
    
    addEventListener(listener: DbEventListener) {
        this.eventListeners.push(listener);
    }
    
    deleteInternal() {
        this.fireEvent({eventName: 'db-deleted'});
        this.eventListeners.length = 0;
    }

    fireEvent(dbEvent: DbEvent) {
        if (!dbEvent.db) dbEvent.db = this;

        this.logger.debug(() => dbEvent);
        this.eventListeners.forEach((listener) => {listener(dbEvent)});
    }


}