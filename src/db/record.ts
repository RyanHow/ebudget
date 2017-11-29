import {DbTransaction} from './transaction';

export abstract class Record<T> {
    /**
     * For the transaction to record map
     */
    public transactions: Array<DbTransaction>;

    /**
     * Place to store cached values for external processors, purely for performance and ease of lookup.
     * This data could be found elsewhere (directly or by calculation) and shouldn't be used within the records or transactions themselves.
     * Cheeky Note: I use this also for testing ideas so I can keep eXperimental data separate.
     */
    public x: any = {}; 

    tableCreationOptions(): any {};
    abstract tableName(): string;
    abstract initTable(table: LokiCollection<T>);
}