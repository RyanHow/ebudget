import {Record} from '../../db/record';

export class Budget extends Record<Budget> {
    
    public name: string;
    
    tableName(): string {
        return 'Budget';
    }
    
    initTable(table: LokiCollection<Budget>) {
        // Nothing needed here:)
    }
}