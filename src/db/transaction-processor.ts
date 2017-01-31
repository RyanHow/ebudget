import {Db} from './db';
import {Record} from './record';

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

    unsupported() {
        throw new Error('Unsupported Transaction Operation');
    }

}