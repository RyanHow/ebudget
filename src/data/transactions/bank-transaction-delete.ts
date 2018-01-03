import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import { BankTransaction } from "../records/bank-transaction";

export class BankTransactionDelete extends DbTransaction {

    bankTransactionId: number;    

    getTypeId(): string {
        return 'BankTransactionDelete';
    }

    apply(tp: TransactionProcessor) {

        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        if (bankTransaction != null) {
            bankTransactionTable.remove(bankTransaction);
        }

    }

    update(tp: TransactionProcessor) {
        this.apply(tp);
    }
    
    undo(tp: TransactionProcessor) {
        // TODO: Not sure how to undo this... we would need to just delete this, then rebuild bank account record (well, rebuild the whole database really)
        throw new Error("Not yet implemented");
    }


    deserialize(field: string, value: any): any {
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        return "Deleted Bank Transaction "; // + ? TODO: Get the bank transaction name

    }

}