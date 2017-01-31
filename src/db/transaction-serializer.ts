import {Injectable} from '@angular/core';
import {Transaction} from './transaction';
import {Logger} from '../services/logger';

@Injectable()
export class TransactionSerializer {
 
    private logger: Logger = Logger.get('TransactionSerializer');

    private transactionTypeIdMap: Map<string, any> = new Map<string, any>();

    registerType<T extends Transaction>(type: {new(): T}) {
        this.transactionTypeIdMap.set(new type().getTypeId(), type);
        this.logger.info('Registered Transaction Type ' + type + ' as ' + new type().getTypeId());
    }
    
    newTransaction<T>(typeId: string, jsonObject?: Object): T {
        var transactionType = this.transactionTypeIdMap.get(typeId);
        if (!transactionType) {
            this.logger.error({'msg': 'No transaction type available for ' + typeId, 'obj': jsonObject});
        }
        var t = new transactionType();
        if (jsonObject) {
            for (var key in jsonObject) {
                t[key] = t.deserialize(key, JSON.parse(JSON.stringify(jsonObject[key])));
            }
        }
        return t;
    }
    
    cloneTransaction<T extends Transaction>(transaction: T): T {
        let dataCopy = <any> JSON.parse(JSON.stringify(transaction)); // Deep copy this so we aren't accidentally copying any references
        delete dataCopy.$loki;
        delete dataCopy.meta;
        delete dataCopy.applied;
        delete dataCopy.config;

        return this.newTransaction<T>(transaction.typeId, dataCopy);
    }
    
    toJson(transaction: Transaction): string {
        return JSON.stringify(transaction);
    }
    
    fromJson<T extends Transaction>(jsonString: string): T {
        var obj = JSON.parse(jsonString);
        return this.newTransaction<T>(obj.typeId, obj);
    }
}