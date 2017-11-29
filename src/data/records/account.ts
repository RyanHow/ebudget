import {Record} from '../../db/record';
import {Processor} from '../../engine/processor';

export class Account extends Record<Account> {
    
    public id: number;
    public name: string;
    public balance: BigJsLibrary.BigJS;
    public accountType: 'Bank' | 'Cash';
    public openingBalance: BigJsLibrary.BigJS;
    public bankLinkId: number;
    public bankLinkConfiguration: any;
    
    processors: Processor[] = [];
    
    tableName(): string {
        return 'Account';
    }
    
    initTable(table: LokiCollection<Account>) {
        table.ensureUniqueIndex('id');
    }
}