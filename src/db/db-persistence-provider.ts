import {DbTransaction} from './transaction';

export interface DbPersistenceProvider  {

    init(): Promise<any>;
    dbs(): Array<string>;
    addDb(dbId: string): Promise<void>;
    unlinkDb(dbId: string);
    transactions(dbId: string): Promise<Array<DbTransaction>>;
    getTransaction(dbId: string, transactionId: number): DbTransaction;
    saveTransaction(dbId: string, transaction: DbTransaction);
    deleteTransaction(dbId: string, transactionId: number);
    keyStore(dbId: string, key: string, value?: string): string;
}