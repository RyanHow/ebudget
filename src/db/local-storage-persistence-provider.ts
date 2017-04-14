import {DbTransaction} from './transaction';
import {TransactionSerializer} from './transaction-serializer';
import {DbPersistenceProvider} from './db-persistence-provider';

export class LocalStoragePersistenceProvider implements DbPersistenceProvider {
    
    
    constructor(private storagePrefix: string, private transactionSerializer: TransactionSerializer) {
    }

    init(): Promise<any> {
        return Promise.resolve();
    }

    dbs(): Array<string> {
        var dbArray = localStorage.getItem(this.storagePrefix + '_dbs');
        if (!dbArray) return [];
        return JSON.parse(dbArray);
    }
    
    addDb(dbId: string): Promise<void> {
        let dbArray = this.dbs();
        if (dbArray.indexOf(dbId) === -1) {
            dbArray.push(dbId);
            localStorage.setItem(this.storagePrefix + '_dbs', JSON.stringify(dbArray));
        }
        return Promise.resolve();
    }
    
    unlinkDb(dbId: string) {
        let dbArray = this.dbs();
        if (dbArray.indexOf(dbId) > -1) {
            dbArray.splice(dbArray.indexOf(dbId), 1);
            this.transactionsSync(dbId).forEach(transaction => {
                this.deleteTransaction(dbId, transaction.id);
            });
            localStorage.setItem(this.storagePrefix + '_dbs', JSON.stringify(dbArray));
        }
    }

    transactionsSync(dbId): Array<DbTransaction> {
        var transactions = [];
        for ( var i = 0, len = localStorage.length; i < len; ++i ) {
            if (localStorage.key( i ).match(this.storagePrefix + '_' + dbId + '_')) {
                var transactionString = localStorage.getItem( localStorage.key( i ) );
                var transaction = this.transactionSerializer.fromJson(transactionString);
                transactions.push(transaction);
            }
        }
        return transactions;
    }



    transactions(dbId): Promise<Array<DbTransaction>> {
        return Promise.resolve(this.transactionsSync(dbId));
    }
    
    
    saveTransaction(dbId: String, transaction: DbTransaction) {
        localStorage.setItem(this.storagePrefix + '_' + dbId + '_' + transaction.id, this.transactionSerializer.toJson(transaction));
    }

    deleteTransaction(dbId: String, transactionId: number) {
        localStorage.removeItem(this.storagePrefix + '_' + dbId + '_' + transactionId);
    }

    getTransaction(dbId: String, transactionId: number): DbTransaction {
        let transactionString = localStorage.getItem(this.storagePrefix + '_' + dbId + '_' + transactionId);
        let transaction = this.transactionSerializer.fromJson(transactionString);
        return transaction;
    }

    keyStore(dbId: string, key: string, value?: string): string {
        var localKey = this.storagePrefix + '_keystore_' + dbId + '_' + key;
        if (typeof value !== 'undefined' )
            localStorage.setItem(localKey, value);

        return localStorage.getItem(localKey);

    }
    
}