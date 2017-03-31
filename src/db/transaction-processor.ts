import {Db} from './db';
import {Record} from './record';
import {DbTransaction} from './transaction';

export class TransactionProcessor {

    private loki: Loki;
    public db: Db;

    constructor(db: Db, loki: Loki) {
        this.loki = loki;
        this.db = db;
    }
    
    private tableByName<T extends Record<any>>(tableName: string, type: {new(): T}): LokiCollection<T> {
        let collection = this.loki.getCollection<T>(tableName + '_' + this.db.id);
        if (collection == null) {
            collection = this.loki.addCollection<T>(tableName + '_' + this.db.id, new type().tableCreationOptions);
            new type().initTable(collection);
        } 
        return collection;
    }

    table<T extends Record<any>>(type: {new(): T}): LokiCollection<T> {
        return this.tableByName<T>(new type().tableName(), type);
    }

    single<T extends Record<any>>(type: {new(): T} ): T {
        let table = this.tableByName<T>(new type().tableName(), type);
        if (!table.data.length) {
            table.insert(new type());
        }
        return table.data[0];
    }


    // TODO: Unmap transaction / record (when undoing a transaction)

    mapTransactionAndRecord(transaction: DbTransaction, record: Record<any>) {
        if (!transaction.records) transaction.records = new Array<Record<any>>();
        if (transaction.records.indexOf(record) == -1) transaction.records.push(record);

        if (!record.transactions) record.transactions = new Array<DbTransaction>();
        if (record.transactions.indexOf(transaction) == -1) record.transactions.push(transaction);
    }

    findAllTransactionsForRecord(record: Record<any>): Array<DbTransaction> {
        return record.transactions;
    }

    findTransactionsForRecord<T extends DbTransaction>(record: Record<any>, type: {new(): T}): Array<T> {
        let typeId = new type().getTypeId();
        return <T[]> record.transactions.filter((t) => t.getTypeId() === typeId);
    }

    findAllRecordsForTransaction<T extends Record<any>>(transaction: DbTransaction): Array<Record<any>> {
        return transaction.records;
    }


    unsupported() {
        throw new Error('Unsupported Transaction Operation');
    }

}