
export abstract class Record<T> {
    tableCreationOptions(): any {};
    abstract tableName(): string;
    abstract initTable(table: LokiCollection<T>);
}