import {Record} from '../../db/record';

export class TransactionReconciliation extends Record<TransactionReconciliation> {
    
    public id: number;
    public transactionId: number;
    public bankTransactionId: number;
    public amount: BigJsLibrary.BigJS;
    public transactionAmountOverride: boolean;

    tableName(): string {
        return 'TransactionReconciliation';
    }

    initTable(table: LokiCollection<TransactionReconciliation>) {
        table.ensureUniqueIndex('id');
    }
    
    tableCreationOptions(): any {
        return {'indices': ['transactionId', 'bankTransactionId']};
    }
}