import {Record} from '../../db/record';
import {Processor} from '../../engine/processor';

export class BankLink extends Record<BankLink> {

    public id: number;
    public uuid: string;
    public name: string;
    public provider: string;
    public configuration: any;

    tableName(): string {
        return "BankLink";
    }

    initTable(table: LokiCollection<BankLink>) {
        table.ensureUniqueIndex('id');
    }

}