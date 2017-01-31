import {Record} from '../../db/record';
import {Processor} from '../../engine/processor';

export class Category extends Record<Category> {
    
    public id: number;
    public name: string;
    public balance: BigJsLibrary.BigJS;
    public engine: {'processors': Processor[]} = {'processors': new Array<Processor>()};
    
    tableName(): string {
        return 'Category';
    }

    initTable(table: LokiCollection<Category>) {
        table.ensureUniqueIndex('id');
    }
}