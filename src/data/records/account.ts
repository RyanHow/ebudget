import {Record} from '../../db/record';
import {Processor} from '../../engine/processor';
import { Big } from "big.js";

export class Account extends Record<Account> {
    
    public id: number;
    public name: string;
    public balance: Big;
    public accountType: 'Bank' | 'Cash';
    public initialBalance: Big;
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