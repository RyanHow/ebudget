import {TransactionProcessor} from './transaction-processor';

export abstract class Transaction {
    public id: number;
    public applied: boolean;
    public deleted: boolean;
    public typeId: string;
    public x: any = {};
    
    constructor() {
        this.typeId = this.getTypeId();
    }
    
    abstract apply(tp: TransactionProcessor);
    abstract update(tp: TransactionProcessor);
    abstract undo(tp: TransactionProcessor);
    abstract getTypeId(): string;
    
    /**
     * Objects are serialized and deserialised using JSON.stringify/parse. Parsed values are passed through this function to restore any type informmation.
     */
    abstract deserialize(field: string, value: any): any;
}