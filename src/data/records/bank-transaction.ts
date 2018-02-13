import {Record} from '../../db/record';
import { Big } from "big.js";
import { BankTransactionReconciliation } from "./bank-transaction-reconciliation";

export class BankTransaction extends Record<BankTransaction> {
    
    public id: number;
    public description: string;
    public date: string;
    public amount: Big;
    public balance: Big;
    public balanceSequence: number;
    public status: 'recent' | 'authorised' | 'processed';
    public accountId: number;
    public flagRemoved: boolean;

    public x : {reconciliationRecords: BankTransactionReconciliation[]; reconciled?: boolean; ignored?: boolean; reconciledRemaining?: Big; [keys: string]: any;}

    tableName(): string {
        return 'BankTransaction';
    }

    initTable(table: LokiCollection<BankTransaction>) {
        table.ensureUniqueIndex('id');
    }
    
    tableCreationOptions(): any {
        //return {'indices': ['categoryId']};
    }
}