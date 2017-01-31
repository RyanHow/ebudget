import {Transaction} from './transaction';

export interface DbPersistenceProvider  {

    init(): Promise<any>;
    dbs(): Array<string>;
    addDb(dbId: string): Promise<void>;
    unlinkDb(dbId: string);
    transactions(dbId): Promise<Array<Transaction>>;
    saveTransaction(dbId: string, transaction: Transaction);
    deleteTransaction(dbId: string, transactionId: number);
    keyStore(dbId: string, key: string, value?: string): string;
}