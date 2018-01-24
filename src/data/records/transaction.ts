import {Record} from '../../db/record';
import { Big } from "big.js";

export class Transaction extends Record<Transaction> {
    
    public id: number;
    public description: string;
    public date: string;
    public amount: Big;
    public categoryId: number;
    public accountId?: number;

    tableName(): string {
        return 'Transaction';
    }

    initTable(table: LokiCollection<Transaction>) {
        table.ensureUniqueIndex('id');
    }
    
    tableCreationOptions(): any {
        return {'indices': ['categoryId']};
    }
}