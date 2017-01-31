import {Record} from '../../db/record';

export class Transaction extends Record<Transaction> {
    
    public id: number;
    public description: string;
    public date: string;
    public amount: BigJsLibrary.BigJS;
    public categoryId: number;
    public config: any = {};

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