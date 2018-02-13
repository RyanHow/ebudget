import {Record} from '../../db/record';
import { Big } from "big.js";
import { BankTransactionReconciliation } from "./bank-transaction-reconciliation";

export class AccountTransaction extends Record<AccountTransaction> {
    
    public id: number;
    public description: string; //Note: This will be the same as category transaction ? - Do we need one "transaction-master" table? with the date, desription, then these just have the account/category and amount ?
    public date: string;
    public amount: Big;

    /**
     * Undefined represents that it is not allocated to any specific accounts (and will be unreconciled).
     */
    public accountId?: number;

    public x : {reconciliationRecords: BankTransactionReconciliation[]; reconciled?: boolean; reconciledRemaining: Big; [keys: string]: any;}

    tableName(): string {
        return 'AccountTransaction';
    }

    initTable(table: LokiCollection<AccountTransaction>) {
        table.ensureUniqueIndex('id');
    }
    
    tableCreationOptions(): any {
        return {'indices': ['accountId']};
    }
}