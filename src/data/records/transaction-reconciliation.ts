import {Record} from '../../db/record';
import { Big } from "big.js";

export class TransactionReconciliation extends Record<TransactionReconciliation> {
    
    public id: number;
    public transactionId: number;
    public bankTransactionId: number;
    public amount: Big;
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