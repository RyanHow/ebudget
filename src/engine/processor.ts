import {TransactionProcessor} from '../db/transaction-processor';

export abstract class Processor {
    
    abstract getTypeId(): String;
    abstract execute(tp: TransactionProcessor);
}