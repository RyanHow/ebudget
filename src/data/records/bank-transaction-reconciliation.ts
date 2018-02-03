import {Record} from '../../db/record';
import { Big } from "big.js";

export class BankTransactionReconciliation extends Record<BankTransactionReconciliation> {
    
    public id: number;
    public accountTransactionId: number;
    public bankTransactionId: number;
    public amount: Big;

    tableName(): string {
        return 'BankTransactionReconciliation';
    }

    initTable(table: LokiCollection<BankTransactionReconciliation>) {
        table.ensureUniqueIndex('id');
    }
    
    tableCreationOptions(): any {
        return {'indices': ['accountTransactionId', 'bankTransactionId']};
    }
}