import {TransactionProcessor} from './transaction-processor';
import {Record} from './record';

export abstract class DbTransaction {
    public id: number;
    public applied: boolean;
    public deleted: boolean;
    public typeId: string;
    public x: any = {};
    public records: Array<Record<any>>;
    
    constructor() {
        this.typeId = this.getTypeId();
    }
    
    abstract apply(tp: TransactionProcessor);
    abstract update(tp: TransactionProcessor, original: DbTransaction);
    abstract undo(tp: TransactionProcessor);
    abstract getTypeId(): string;

    abstract toHumanisedString(env: TransactionStringEnv): string;
    
    /**
     * Objects are serialized and deserialised using JSON.stringify/parse. Parsed values are passed through this function to restore any type informmation.
     */
    abstract deserialize(field: string, value: any): any;
}

export class TransactionStringEnv {
    action: 'apply' | 'update' | 'undo';
    currencyFormatter: (value: any) => string;
    originalTransaction?: DbTransaction;
}