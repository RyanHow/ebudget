import {DbTransaction} from './transaction';

export abstract class Record<T> {
    /**
     * For the transaction to record map
     */
    public transactions: Array<DbTransaction>;

    /**
     * Place to store cached values, purely for performance and ease of lookup, this data could be found elsewhere
     */
    public x: any = {}; 

    tableCreationOptions(): any {};
    abstract tableName(): string;
    abstract initTable(table: LokiCollection<T>);
}