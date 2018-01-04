import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import { BankTransaction } from "../records/bank-transaction";
import { Logger } from "../../services/logger";

export class BankTransactionIgnore extends DbTransaction {

    bankTransactionId: number;    

    getTypeId(): string {
        return 'BankTransactionIgnore';
    }

    apply(tp: TransactionProcessor) {

        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        if (bankTransaction != null) {
            bankTransaction.x.ignored = true;
            bankTransactionTable.update(bankTransaction);
            tp.mapTransactionAndRecord(this, bankTransaction);
        } else {
            Logger.get('bank-transaction-ignore').info('Trying to ignore a non existant bank transaction... Skipping.');            
        }

    }

    update(tp: TransactionProcessor) {
        this.apply(tp);
    }
    
    undo(tp: TransactionProcessor) {
        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        if (bankTransaction != null) {
            bankTransaction.x.ignored = undefined;
            //delete bankTransaction.x.ignored; Keep the property so we can bind to it
            bankTransactionTable.update(bankTransaction);
            tp.unmapTransactionAndRecord(this, bankTransaction);
        } else {
            Logger.get('bank-transaction-ignore').info('Trying to unignore a non existant bank transaction... Skipping.');            
        }
    }


    deserialize(field: string, value: any): any {
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {

        return "Ignored Bank Transaction "; // + ? TODO: Get the bank transaction name
        // TODO: unignored...

    }

}