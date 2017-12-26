import {SQLite, SQLiteObject} from '@ionic-native/sqlite';
import {DbTransaction} from './transaction';
import {TransactionSerializer} from './transaction-serializer';
import {DbPersistenceProvider} from './db-persistence-provider';
import {Logger} from '../services/logger';

export class SqlStoragePersistenceProvider implements DbPersistenceProvider  {
    
   private logger: Logger = Logger.get('SqlStoragePersistenceProvider');

    private sqlStorage: SQLiteObject;
    private keyStoreCache: Map<string, string>;
    private dbsCache: Array<string>;
    private transactionsCache: Map<string, string>;

    constructor(private storagePrefix: string, private transactionSerializer: TransactionSerializer, private sqlite: SQLite) {
        this.keyStoreCache = new Map<string, string>();
        this.transactionsCache = new Map<string, string>();
    }

    init(): Promise<any> {
        return this.sqlite.create({name: this.storagePrefix + '_db', location: 'default'}).then((db: SQLiteObject) => {
            this.sqlStorage = db;
            return this.sqlStorage.executeSql('CREATE TABLE IF NOT EXISTS _keystore (dbid TEXT, key TEXT, keyvalue TEXT, PRIMARY KEY (dbid, key))', []);})
        .then(() => {
            return this.sqlStorage.executeSql('SELECT * FROM _keystore', [])
            .then(result => {
                for (let i = 0; i < result.rows.length; i++) {
                    let item = result.rows.item(i);
                    this.keyStoreCache.set(item.dbid + '_' + item.key, item.keyvalue);
                }
            }).then(() => {
                let dbsValue = this.keyStore("_dbs", "dbs");
                this.dbsCache = dbsValue ? JSON.parse(dbsValue) : [];            
                let p = new Array<Promise<void>>();
                this.dbsCache.forEach(dbId => {
                    p.push(this.createDbTables(dbId));
                });
                return Promise.all(p);
            })
        });
    }

    
    dbs(): Array<string> {
        return this.dbsCache;
    }
    
    createDbTables(dbId): Promise<any> {
        let p = new Array<Promise<void>>();
        p.push(this.sqlStorage.executeSql('CREATE TABLE IF NOT EXISTS db_' + this.sanitise(dbId) + '_transaction (id INTEGER PRIMARY KEY, dbtransaction TEXT)', []));
        return Promise.all(p);
    }

    addDb(dbId: string): Promise<void> {
        let dbArray = this.dbs();
        if (dbArray.indexOf(dbId) === -1) {
            dbArray.push(dbId);
            return this.createDbTables(dbId).then(() => {
                this.keyStore('_dbs', 'dbs', JSON.stringify(dbArray));
            }).catch(err => {
                this.logger.error('Error adding db', err);
            });
        }
    }
    
    unlinkDb(dbId: string) {
        let dbArray = this.dbs();
        if (dbArray.indexOf(dbId) > -1) {
            dbArray.splice(dbArray.indexOf(dbId), 1);
            this.keyStore('_dbs', 'dbs', JSON.stringify(dbArray));

            this.sqlStorage.executeSql('DROP TABLE IF EXISTS db_' + this.sanitise(dbId) + '_transaction', []).catch(err => {
                this.logger.error({'msg': 'Error dropping database db_' + dbId + '_transaction', 'err': err});
            });
            this.sqlStorage.executeSql('DROP TABLE IF EXISTS db_' + this.sanitise(dbId) + '_keystore', []).catch(err => {
                this.logger.error({'msg': 'Error dropping database db_' + dbId + '_keystore', 'err': err});
            });
        }
    }

    transactions(dbId): Promise<Array<DbTransaction>> {

        return this.sqlStorage.executeSql('SELECT dbtransaction FROM db_' + this.sanitise(dbId) + '_transaction ORDER BY id', []).then(result => {
            let transactions = [];
            for (let i = 0; i < result.rows.length; i++) {
                let transactionString = result.rows.item(i).dbtransaction;
                let transaction = this.transactionSerializer.fromJson(transactionString);
                transactions.push(transaction);
                this.transactionsCache.set(this.sanitise(dbId) + '_' + transaction.id, transactionString);
            }
            return transactions;
        }).catch(err => {
            this.logger.error('Error getting db transactions', err);
            return [];
        });
    }
    
    
    saveTransaction(dbId: string, transaction: DbTransaction) {
        let transactionString = this.transactionSerializer.toJson(transaction);
        this.sqlStorage.executeSql('INSERT OR REPLACE INTO db_' + this.sanitise(dbId) + '_transaction (id, dbtransaction) VALUES (?, ?)',
        [transaction.id, transactionString])
        .catch(err => {
            this.logger.error('Error inserting/replacing transaction in database db_' + dbId + '_transaction for id ' + transaction.id, err);
            // TODO: Application halt ?

        });
        this.transactionsCache.set(this.sanitise(dbId) + '_' + transaction.id, transactionString);
    }

    deleteTransaction(dbId: string, transactionId: number) {
        this.sqlStorage.executeSql('DELETE FROM db_' + this.sanitise(dbId) + '_transaction WHERE id = ?', [transactionId])
        .catch(err => {
            this.logger.error('Error deleting transaction in table db_' + dbId + '_transaction for id ' + transactionId, err);
            // TODO: Application halt ?

        });
        this.transactionsCache.delete(this.sanitise(dbId) + '_' + transactionId);
    }

    getTransaction(dbId: string, transactionId: number): DbTransaction {
        let transactionString = this.transactionsCache.get(this.sanitise(dbId) + '_' + transactionId);
        let transaction = this.transactionSerializer.fromJson(transactionString);
        return transaction;
    }

    
    keyStore(dbId: string, key: string, value?: string): string {
        var localKey = dbId + '_' + key;
        if (typeof value !== 'undefined' ) {
            this.keyStoreCache.set(localKey, value);
            this.sqlStorage.executeSql('INSERT OR REPLACE INTO _keystore (dbid, key, keyvalue) VALUES (?, ?, ?)',
            [dbId, key, value])
            .catch(err => {
                this.logger.error('Error inserting/replacing in table _keystore for dbid/key/value ' + dbId + '/' + key + '/' + value, err);
                // TODO: Application halt ? - need to at least stop them doing more - warning - fatal error has occured....
            });

        }

        return this.keyStoreCache.get(localKey);

    }

    private sanitise(dbId: string): string {
        return dbId.split('-').join('');
    }
    
}