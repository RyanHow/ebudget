import {Injectable} from '@angular/core';
import {DbTransaction} from './transaction';
import {Logger} from '../services/logger';

@Injectable()
export class TransactionSerializer {
 
    private logger: Logger = Logger.get('TransactionSerializer');

    private transactionTypeIdMap: Map<string, any> = new Map<string, any>();

    registerType<T extends DbTransaction>(type: {new(): T}) {
        this.transactionTypeIdMap.set(new type().getTypeId(), type);
        this.logger.info('Registered Transaction Type ' + new type().getTypeId());
    }
    
    newTransaction<T>(typeId: string, jsonObject?: Object): T {
        var transactionType = this.transactionTypeIdMap.get(typeId);
        if (!transactionType) {
            this.logger.error({'msg': 'No transaction type available for ' + typeId, 'obj': jsonObject});
        }
        var t = <DbTransaction> new transactionType();
        if (jsonObject) {
            for (var key in jsonObject) {
                t[key] = t.deserialize(key, JSON.parse(JSON.stringify(jsonObject[key])));
            }
        }
        return <any> t;
    }
    
    cloneTransaction<T extends DbTransaction>(transaction: T): T {
        let recordsTemp = transaction.records;
        transaction.records = null;        
        let dataCopy = <DbTransaction> JSON.parse(JSON.stringify(transaction)); // Deep copy this so we aren't accidentally copying any references
        transaction.records = recordsTemp;

        delete (<any>dataCopy).$loki;
        delete (<any>dataCopy).meta;
        delete dataCopy.applied;
        delete dataCopy.records;

        return this.newTransaction<T>(transaction.typeId, dataCopy);
    }
    
    toJson(transaction: DbTransaction): string {
        return JSON.stringify(transaction);
    }
    
    fromJson<T extends DbTransaction>(jsonString: string): T {
        var obj = JSON.parse(jsonString);
        return this.newTransaction<T>(obj.typeId, obj);
    }
}