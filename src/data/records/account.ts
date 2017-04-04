import {Record} from '../../db/record';

export class Account extends Record<Account> {
    
    public id: number;
    public name: string;
    public balance: BigJsLibrary.BigJS;
    public accountType: 'Bank' | 'Cash';
    public openingBalance: BigJsLibrary.BigJS;
    
    
    tableName(): string {
        return 'Account';
    }
    
    initTable(table: LokiCollection<Account>) {
        table.ensureUniqueIndex('id');
    }
}