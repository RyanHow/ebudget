import {DbTransaction} from './transaction';
import {TransactionSerializer} from './transaction-serializer';
import {DbPersistenceProvider} from './db-persistence-provider';

export class NoPersistenceProvider implements DbPersistenceProvider {
    
    dbArray = [];
    tempStorage = new Map<string, string>();
    
    constructor(private transactionSerializer: TransactionSerializer) {
    }


    init(): Promise<any> {
        return Promise.resolve();
    }

    dbs(): Array<string> {
        return this.dbArray;
    }
    
    addDb(dbId: string): Promise<void> {
        if (this.dbArray.indexOf(dbId) === -1) this.dbArray.push(dbId);
        return Promise.resolve();
    }
    
    unlinkDb(dbId: string) {
        if (this.dbArray.indexOf(dbId) > -1) {
            this.dbArray.splice(this.dbArray.indexOf(dbId), 1);
            this.transactionsSync(dbId).forEach(transaction => {
                this.deleteTransaction(dbId, transaction.id);
            });
        }
    }

    transactionsSync(dbId): Array<DbTransaction> {
        var transactions = [];
        this.tempStorage.forEach((key, val) => {
            if (key.startsWith(dbId + '_')) {
                var transaction = this.transactionSerializer.fromJson(val);
                transactions.push(transaction);
            }
        });
        return transactions;
    }



    transactions(dbId): Promise<Array<DbTransaction>> {
        return Promise.resolve(this.transactionsSync(dbId));
    }
    
    
    saveTransaction(dbId: String, transaction: DbTransaction) {
        this.tempStorage.set(dbId + '_' + transaction.id, this.transactionSerializer.toJson(transaction));
    }

    deleteTransaction(dbId: String, transactionId: number) {
        this.tempStorage.delete(dbId + '_' + transactionId);
    }

    getTransaction(dbId: String, transactionId: number): DbTransaction {
        let transactionString = this.tempStorage.get(dbId + '_' + transactionId);
        let transaction = this.transactionSerializer.fromJson(transactionString);
        return transaction;
    }

    keyStore(dbId: string, key: string, value?: string): string {
        var localKey = 'keystore_' + dbId + '_' + key;
        if (typeof value !== 'undefined' )
            this.tempStorage.set(localKey, value);

        return this.tempStorage.get(localKey);

    }
    
}