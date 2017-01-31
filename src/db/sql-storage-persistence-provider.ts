import {Injectable} from '@angular/core';
import {SQLite} from 'ionic-native';
import {Storage} from '@ionic/storage';
import {Transaction} from './transaction';
import {TransactionSerializer} from './transaction-serializer';
import {DbPersistenceProvider} from './db-persistence-provider';
import {Logger} from '../services/logger';

@Injectable()
export class SqlStoragePersistenceProvider implements DbPersistenceProvider  {
    
   private logger: Logger = Logger.get('SqlStoragePersistenceProvider');

    private sqlStorage: SQLite;
    private keyStoreCache: Map<string, string>;
    private dbsCache: Array<string>;

    constructor(private storagePrefix: string, private transactionSerializer: TransactionSerializer, private storage: Storage) {
        this.keyStoreCache = new Map<string, string>();
    }

    init(): Promise<any> {
        this.sqlStorage = new SQLite();
        return this.sqlStorage.openDatabase({name: this.storagePrefix + '_db', location: 'default'}).then(() => {
            let p1 = this.storage.get('_dbs').then(value => {
                this.dbsCache = value ? JSON.parse(value) : [];            
                let p = new Array<Promise<void>>();
                this.dbsCache.forEach(dbId => {
                    p.push(this.createDbTables(dbId));
                });
                return Promise.all(p);
            });
            

            return p1;
        });
    }

    
    dbs(): Array<string> {
        return this.dbsCache;
    }
    
    createDbTables(dbId): Promise<any> {
        let p = new Array<Promise<void>>();
        p.push(this.sqlStorage.executeSql('CREATE TABLE IF NOT EXISTS db_' + this.sanitise(dbId) + '_transaction (id INTEGER PRIMARY KEY, dbtransaction TEXT)', []));
        p.push(this.sqlStorage.executeSql('CREATE TABLE IF NOT EXISTS db_' + this.sanitise(dbId) + '_keystore (key TEXT PRIMARY KEY, keyvalue TEXT)', []));
        p.push(this.sqlStorage.executeSql('SELECT * FROM db_' + this.sanitise(dbId) + '_keystore', []).then(result => {
            for (let i = 0; i < result.res.rows.length; i++) {
                let item = result.res.rows.item(i);
                this.keyStoreCache.set(dbId + '_' + item.key, item.keyvalue);
            }
        }));
        return Promise.all(p);
    }

    addDb(dbId: string): Promise<void> {
        let dbArray = this.dbs();
        if (dbArray.indexOf(dbId) === -1) {
            dbArray.push(dbId);
            return this.createDbTables(dbId).then(() => {
                return this.storage.set('_dbs', JSON.stringify(dbArray));
            }).catch(err => {
                this.logger.error('Error adding db', err);
            });
        }
    }
    
    unlinkDb(dbId: string) {
        let dbArray = this.dbs();
        if (dbArray.indexOf(dbId) > -1) {
            dbArray.splice(dbArray.indexOf(dbId), 1);
            this.storage.set('_dbs', JSON.stringify(dbArray));

            this.sqlStorage.executeSql('DROP TABLE IF EXISTS db_' + this.sanitise(dbId) + '_transaction', []).catch(err => {
                this.logger.error({'msg': 'Error dropping database db_' + dbId + '_transaction', 'err': err});
            });
            this.sqlStorage.executeSql('DROP TABLE IF EXISTS db_' + this.sanitise(dbId) + '_keystore', []).catch(err => {
                this.logger.error({'msg': 'Error dropping database db_' + dbId + '_keystore', 'err': err});
            });
        }
    }

    transactions(dbId): Promise<Array<Transaction>> {

        return this.sqlStorage.executeSql('SELECT dbtransaction FROM db_' + this.sanitise(dbId) + '_transaction ORDER BY id', []).then(result => {
            let transactions = [];
            for (let i = 0; i < result.res.rows.length; i++) {
                let transactionString = result.res.rows.item(i).dbtransaction;
                let transaction = this.transactionSerializer.fromJson(transactionString);
                transactions.push(transaction);
            }
            return transactions;
        }).catch(err => {
            this.logger.error('Error getting db transactions', err);
        });
    }
    
    
    saveTransaction(dbId: string, transaction: Transaction) {
        this.sqlStorage.executeSql('INSERT OR REPLACE INTO db_' + this.sanitise(dbId) + '_transaction (id, dbtransaction) VALUES (?, ?)',
        [transaction.id, this.transactionSerializer.toJson(transaction)])
        .catch(err => {
            this.logger.error('Error inserting/replacing transaction in database db_' + dbId + '_transaction for id ' + transaction.id, err);
            // TODO: Application halt ?

        });

    }

    deleteTransaction(dbId: string, transactionId: number) {
        this.sqlStorage.executeSql('DELETE FROM db_' + this.sanitise(dbId) + '_transaction WHERE id = ?', [transactionId])
        .catch(err => {
            this.logger.error('Error deleting transaction in database db_' + dbId + '_transaction for id ' + transactionId, err);
            // TODO: Application halt ?

        });
    }

    
    keyStore(dbId: string, key: string, value?: string): string {
        var localKey = dbId + '_' + key;
        if (typeof value !== 'undefined' ) {
            this.keyStoreCache.set(localKey, value);
            this.sqlStorage.executeSql('INSERT OR REPLACE INTO db_' + this.sanitise(dbId) + '_keystore (key, keyvalue) VALUES (?, ?)',
            [key, value])
            .catch(err => {
                this.logger.error('Error inserting/replacing in database db_' + dbId + '_keystore for key/value ' + key + '/' + value, err);
                // TODO: Application halt ? - need to at least stop them doing more - warning - fatal error has occured....

            });

        }

        return this.keyStoreCache.get(localKey);

    }

    private sanitise(dbId: string): string {
        return dbId.split('-').join('');
    }
    
}