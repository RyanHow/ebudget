import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Dbms} from '../db/dbms';
import {Db} from '../db/db';
import {Transaction} from '../db/transaction';
import {TransactionSerializer} from '../db/transaction-serializer';
import * as JsonStableStringify from 'json-stable-stringify';
import {Logger} from './logger';

/**
* The Repl service listens to the database transactions, add/edit/delete and generates replication records. It then "syncs" those. It also fetched remote replication records and creates transactions out of them for the database to process...
**/
@Injectable()
export class Replication {
    private logger: Logger = Logger.get('Replication');

    syncDelay: number = 1000; // 1 second
    delayTimeout: number;
    pollInterval: number = 15 * 60 * 1000; // 15 minutes
    errorRetryInterval: number = 10 * 1000; // 10 seconds
    syncing: { running?: boolean; q?: Promise<any>; nextTimeout?: number; lastSync?: number; lastResultSuccess?: boolean; lastError?: SyncErrorData; consecutiveErrorCount?: number; } = {}; // Holds the latest / current syncing info
    queues = {};
    heads = {};
    incrementingReplId: number = 100;
    processingTransaction: boolean;

    constructor(private dbms: Dbms, private http: Http, private transactionSerializer: TransactionSerializer) {
        
        // TODO: Move the syncing promise to an observable, so we can just "subscribe" ?
        
        this.syncing.running = false; // Is there currently a sync running?
        this.syncing.q = null; // The latest syncing call
        this.syncing.nextTimeout = null;
        this.syncing.lastSync = null;
        this.syncing.lastResultSuccess = true;
        this.syncing.lastError = null;
        this.syncing.consecutiveErrorCount = 0;

    }
    
    init() {
        
        this.dbms.dbs.forEach((db) => {
            if (this.enabled(db)) {
                this.processDb(db);
                this.monitorDb(db);
            }            
        });


        this.scheduleSync(this.syncDelay);

    }

    enable(db: Db, deviceReplId: string) {
        db.localSetting('repl', '1');
        db.transactionIdLocalGen(deviceReplId);
        this.processDb(db);
        this.monitorDb(db);
        this.scheduleSync(this.syncDelay);
    }

    disable(db: Db) {
        let deviceReplId = this.enabled(db);
        db.localSetting('repl', '');

        let dbDeviceReplId = db.id + '_' + deviceReplId;
        delete this.heads[dbDeviceReplId];
        delete this.queues[db.id];
    }

    enabled(db: Db): any {
        return db.localSetting('repl') === '1' ? db.transactionIdLocalGen() + '' : false;
    }

    monitorDb(db: Db) {
        db.addEventListener((eventName, data) => {
            if (this.processingTransaction) return;
            if (eventName === 'transaction-applied' || eventName === 'transaction-undone') {
                this.processTransaction(db, data.transaction);
            }
            if (eventName === 'activated') {
                // Add a head just incase initalised without any transactions (which happens on linking)
                this.updateHead(db, { 'id': 0, 'deviceReplId': this.enabled(db) });
            }
            if (eventName === 'deleted') {
                this.disable(db);
            }
        });

    }

    processDb(db: Db) {

        this.updateHead(db, { 'id': 0, 'deviceReplId': this.enabled(db) });
        
        let sortedDbTransactions = db.sortedTransactions.data();
        for (let i = 0; i < sortedDbTransactions.length; i++) {
            let t = sortedDbTransactions[i];
            this.logger.debug('Initial transaction iterating: ', () => JSON.stringify(t));
            this.processTransaction(db, t);
        }
    }


    /**
    * Process the transaction for replication (generate replication records as needed) and add them to the queue
    * The queue is watched and "pushed" after a short timeout so that a push is batched
    **/
    processTransaction(db: Db, transaction: Transaction) {
        if (!this.enabled(db)) return;

        this.logger.debug('- Start Processing Transaction - ', () =>  JSON.stringify(transaction));

        let transactionCopy = this.transactionSerializer.cloneTransaction(transaction);
        delete transactionCopy.x.repl;

        if (!transaction.x.repl) transaction.x.repl = [];
        let checksum = this.checksumObject(transactionCopy);
        let noReplRecords = transaction.x.repl.length === 0;
        let checksumMismatch = transaction.x.repl.length > 0 && transaction.x.repl[0].checksum !== checksum;
        let newReplRecord = noReplRecords || checksumMismatch;


        // If none, or if they are older (different?), etc, then create a new one
        if (newReplRecord) {
            if (checksumMismatch) this.logger.debug('New Repl Record due to checksum mismatch - ' + transaction.x.repl[0].checksum + ': ' + checksum);

            let r = new Repl();
            let headId = transaction.x.repl.length ? transaction.x.repl[0].id : 0;
            let nextId = this.nextReplId();
            if (nextId < headId) {
                nextId = headId + 1; // Make sure the one just generated is the latest for that transaction in the case of clock skew. Assume this will happen rarely and device clocks are fairly in-sync. Otherwise will need a better synchronisation system. Perhaps synced on the replication server would be the simplest. This current method also allows for a slight chance of duplicate replId in the future, but very slim, so not going to worry about it.
            }
            r.id = nextId;
            r.timestamp = new Date().getTime();
            r.deviceReplId = this.enabled(db);
            r.synced = 0;
            r.checksum = checksum;
            // r.rollingChecksum = r.checksum + dbDeviceHeadChecksum;
            r.transaction = transactionCopy;

            transaction.x.repl.splice(0, 0, r);
            try {
                this.processingTransaction = true;
                db.saveTransaction(transaction);
            } finally {
                this.processingTransaction = false;
            }
            this.logger.debug('inserted repl record:', () => JSON.stringify(transaction));
        } 

        for (let i = 0; i < transaction.x.repl.length; i++) {
            let record = transaction.x.repl[i];
            if (record.synced) this.updateHead(db, record);
            if (!record.synced) this.queueRepl(db.id, record, transactionCopy);
        }

        this.logger.debug('- End Processing Transaction - ', () => JSON.stringify(transaction));


    };

    queueRepl (dbId: string, repl: Repl, transaction: Transaction) {
        // Get the queue for the dbId (or create it)
        if (!this.queues[dbId]) {
            this.queues[dbId] = new Map();
        }

        let queue = this.queues[dbId];
        queue.set(repl.id + '_' + repl.deviceReplId, repl);

        this.logger.debug(() => 'queueRepl: ' + repl.id + '_' + repl.deviceReplId + ': ' + JSON.stringify(repl) + ': ' + JSON.stringify(queue.get(repl.id + '_' + repl.deviceReplId)));

        if (this.delayTimeout) {
            clearTimeout(this.delayTimeout);
            this.delayTimeout = 0;
        }
        this.delayTimeout = setTimeout(() => { this.safeSync(); }, this.syncDelay);
    };


    updateHead(db: Db, repl) {
        let dbDeviceReplId = db.id + '_' + repl.deviceReplId;
        this.logger.debug(() => 'Check Repl Head: ' + dbDeviceReplId + ': ' + JSON.stringify({ 'replId': repl.id, 'deviceReplId': repl.deviceReplId, 'dbId': db.id }));

        if (!this.heads[dbDeviceReplId] || repl.id > this.heads[dbDeviceReplId].replId) {

            this.heads[dbDeviceReplId] = { 'replId': repl.id, 'deviceReplId': repl.deviceReplId, 'dbId': db.id }; // TODO: Checksum for rolling checksum?
            this.logger.debug('Update Repl Head: ' + dbDeviceReplId + ': ', () =>  JSON.stringify(this.heads[dbDeviceReplId]));
        }
    };


    nextReplId(): number {
        this.incrementingReplId++;
        if (this.incrementingReplId > 999) this.incrementingReplId = 100;
        return (new Date().getTime() * 1000) + this.incrementingReplId;
    }

    checksumObject(o): number {
        let i;
        let chk = 0x12345678;
        let s = JsonStableStringify(o);

        for (i = 0; i < s.length; i++) {
            chk += (s.charCodeAt(i) * (i + 1));
        }

        return chk;
    }


    checksum(s): number {
        let i;
        let chk = 0x12345678;

        for (i = 0; i < s.length; i++) {
            chk += (s.charCodeAt(i) * (i + 1));
        }

        return chk;
    }

    scheduleSync(delay?: number) {

        if (this.syncing.nextTimeout) {
            clearTimeout(this.syncing.nextTimeout);
            this.syncing.nextTimeout = null;
        }


        if (!delay) {
            if (this.syncing.lastResultSuccess) {
                delay = this.pollInterval;
            } else {
                delay = this.errorRetryInterval * this.syncing.consecutiveErrorCount;
                if (this.errorRetryInterval > this.pollInterval) delay = this.pollInterval;
            }
        }

        this.syncing.nextTimeout = setTimeout(() => { this.safeSync(); }, delay);
    }

    /** SafeSync will return success unless there is an internal error */

    sync(safe: boolean = false): Promise<any> {
        this.logger.debug('SYNC');


        if (this.syncing.running) return this.syncing.q;

        this.syncing.running = true;
        this.syncing.lastSync = new Date().getTime();
        if (this.syncing.nextTimeout) {
            clearTimeout(this.syncing.nextTimeout);
            this.syncing.nextTimeout = null;
        }
        let syncing = this.syncing;

        this.syncing.q = new Promise((success, fail) => {
            this.doSync(() => {
                syncing.running = false;
                this.logger.debug('SYNC: Success');
                syncing.lastResultSuccess = true;
                syncing.consecutiveErrorCount = 0;
                this.scheduleSync();
                success();
            }, (error) => {
                syncing.running = false;
                syncing.lastResultSuccess = false;
                if (syncing.lastError && ((syncing.lastError.connectionIssue && !error.connectionIssue) || (syncing.lastError.serverIssue && !error.serverIssue) || (syncing.lastError.internalIssue && !error.internalIssue))) syncing.consecutiveErrorCount = 0;
                syncing.lastError = error;
                syncing.consecutiveErrorCount++;
                this.logger.debug('SYNC: Fail - ', syncing);
                this.scheduleSync();
                if (!safe || error.internalIssue) {
                    fail(error);
                } else {
                    success();
                }
            });
        });
        return this.syncing.q;

    }
    /** SafeSync will return success unless there is an internal error */
    safeSync(): Promise<any> {
        return this.sync(true);
    }

    private doSync(success, error: (data: SyncErrorData) => any) {
        let replData: any = {};

        let totalPushCount = 0;

        Object.keys(this.queues).forEach((dbId) => {
            let replMap = this.queues[dbId];
            if (replMap.length !== 0) {
                if (!replData.push) replData.push = [];
                let found = false;
                for (var i = 0; i < replData.push.length; i++) { if (replData.push[i].dbId === dbId) { found = true; break; } }
                let pushDb = found ? replData.push[i] : replData.push[replData.push.push({ 'dbId': dbId, 'repl': [] }) - 1];

                replMap.forEach((r, key) => {
                    let replDataRecord = { 'deviceReplId': r.deviceReplId, 'replData': JsonStableStringify({ transaction: r.transaction, 'timestamp': r.timestamp, 'checksum': r.checksum }), 'id': r.id };
                    pushDb.repl.push(replDataRecord);
                    totalPushCount++;
                });

            }
        });

        Object.keys(this.heads).forEach((dbDeviceReplId) => {
            let r = this.heads[dbDeviceReplId];
            let headRecord = { 'replId': r.replId, 'deviceReplId': r.deviceReplId, 'dbId': r.dbId };
            if (!replData.fetch) replData.fetch = [];
            replData.fetch.push(headRecord);
        });

        this.logger.debug(() => replData);

        if (!replData.push && !replData.fetch) {
            success(); // no-op really
            return;
        }

        if (totalPushCount) {
            this.logger.info('Pushing ' + totalPushCount + ' Records');
        }

        this.http.post('https://api.freebudgetapp.com/sync', JSON.stringify(replData))
        .map(res => res.json())
        .subscribe((response) => {
            this.logger.debug(() => response);
            try {
                // Process the data I got
                if (response.processed) {
                    let totalIncomingProcessed = 0;
                    response.processed.forEach((dbProcessed) => {
                        let dbId = dbProcessed.dbId;
                        let db = this.dbms.getDb(dbId);
                        let replMap = this.queues[dbId];
                        if (dbProcessed && dbProcessed.processed) {
                            dbProcessed.processed.forEach((replProcessed) => {
                                if (replProcessed.success ) {
                                    totalIncomingProcessed++;
                                    if (replProcessed.success !== true) {
                                        this.logger.error('Replication success status: ' + replProcessed.success);
                                    }
                                    let key = replProcessed.replId + '_' + replProcessed.deviceReplId;
                                    let replRecord = replMap.get(key);
                                    replRecord.synced = new Date().getTime();
                                    let originalTransaction = db.getTransaction(replRecord.transaction.id);
                                    try {
                                        this.processingTransaction = true;
                                        db.saveTransaction(originalTransaction);
                                    } finally {
                                        this.processingTransaction = false;
                                    }
                                    replMap.delete(key);
                                }
                            });
                        }
                    });
                    if (totalIncomingProcessed > 0 || totalPushCount !== totalIncomingProcessed) {
                        this.logger.info('Server responded ' + totalIncomingProcessed + ' records successfully processed');
                    }
                }

                if (response.repl) {
                    response.repl.forEach((replRecord) => {
                        replRecord.replId = parseInt(replRecord.replId);
                        let dbId = replRecord.dbId;
                        let db = this.dbms.getDb(dbId);
                        // dbId, replId, deviceReplId, replData
                        // replData -> transaction, timestamp, checksum
                        this.logger.debug('Processing incoming replRecord - ', () =>  JSON.stringify(replRecord));

                        // Get the transaction by id from the db
                        let replData = JSON.parse(replRecord.replData);
                        let transaction = db.getTransaction(replData.transaction.id);
                        let isExisting = transaction && true;
                        this.logger.debug('Is Existing: ' + isExisting);
                        this.logger.debug(() => JSON.stringify(transaction));
                        if (!transaction) transaction = this.transactionSerializer.cloneTransaction(replData.transaction);
                        if (!transaction.x.repl) transaction.x.repl = [];
                        if (transaction.x.repl.some((e) => { 
                                this.logger.debug('Check: ' + e.id + ' === ' + replRecord.replId + ' && ' + e.deviceReplId + ' === ' + replRecord.deviceReplId);
                                return e.id === replRecord.replId && e.deviceReplId === replRecord.deviceReplId; })) {
                            // We've already got it... do something ? Like a checksum?
                            // TODO: Can probably just drop it here, it is already in sync
                            this.logger.debug('Repl record already exists for transaction');
                        } else {
                            this.logger.debug('Adding repl record to transaction');

                            // Reconstruct the repl record
                            let r = new Repl();
                            r.id = replRecord.replId;
                            r.timestamp = replData.timestamp;
                            r.deviceReplId = replRecord.deviceReplId;
                            r.synced = new Date().getTime();
                            r.checksum = replData.checksum;
                            // this.checksumObject(transactionCopy); // TODO: Check this
                            // r.rollingChecksum = r.checksum + dbDeviceHeadChecksum;
                            r.transaction = replData.transaction;
                            transaction.x.repl.splice(0, 0, r);

                        }

                        transaction.x.repl.sort((a, b) => {
                            return b.id - a.id === 0 ? a.deviceReplId - b.deviceReplId : b.id - a.id;
                        });

                        this.logger.debug('Transaction after sorting - ', () =>  JSON.stringify(transaction));


                        if (isExisting) {
                            // Were copying fields from the updated transaction to the database attached one
                            this.logger.debug('Updating transaction record in database');

                            let updatedTransaction = transaction.x.repl[0].transaction;
                            let repl = transaction.x.repl;

                            Object.keys(transaction).forEach((key) => {
                                if (key !== '$loki' && key !== 'meta' && key !== 'applied') delete transaction[key];
                            });
                            Object.keys(updatedTransaction).forEach((key) => {
                                if (key !== '$loki' && key !== 'meta' && key !== 'applied')
                                    transaction[key] = transaction.deserialize(key, JSON.parse(JSON.stringify(updatedTransaction[key])));
                            });
 
                            transaction.x.repl = repl;
                        }

                        this.logger.debug('Processing transaction record - ', () => JSON.stringify(transaction));

                        try {
                            this.processingTransaction = true;
                            db.applyTransaction(transaction);
                        } finally {
                            this.processingTransaction = false;
                        }

                        this.updateHead(db, transaction.x.repl[0]);

                        this.logger.debug('- End Processing incoming replRecord');


                    });

                    this.logger.info('Processed ' + response.repl.length + ' Incoming Repl Records');
                }

            } catch (e) {
                let errorData = new SyncErrorData();
                errorData.error = e;
                errorData.message = 'Internal Error in Processing Sync Response';
                errorData.internalIssue = true;
                error(errorData);
                return;
            }

            success();
        }, (response) => {
            let errorData = new SyncErrorData();
            errorData.message = 'Server Error in Processing Sync Response: ' + response;
            errorData.serverIssue = true;
            error(errorData);
        });
    }
    
    
}

export class Repl {
    id: number;
    timestamp: number;
    deviceReplId: string;
    synced: any;
    checksum: number;
    transaction: Transaction;

}

export class SyncErrorData {
    error: Error;
    message: String;
    connectionIssue: boolean = false;
    internalIssue: boolean = false;
    serverIssue: boolean = false;
}