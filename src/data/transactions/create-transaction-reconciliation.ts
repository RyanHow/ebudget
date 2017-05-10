import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import Big from 'big.js';
import { TransactionReconciliation } from "../records/transaction-reconciliation";
import { Transaction } from "../records/transaction";
import { BankTransaction } from "../records/bank-transaction";


export class CreateTransactionReconciliation extends DbTransaction {

    amount: BigJsLibrary.BigJS;
    transactionId: number;
    bankTransactionId: number;


    getTypeId(): string {
        return 'CreateTransactionReconciliation';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(TransactionReconciliation);
        let t = new TransactionReconciliation();
        t.id = this.id * 100000;
        t.amount = this.amount;
        t.transactionId = this.transactionId;
        t.bankTransactionId = this.bankTransactionId;
        

        let transactionTable = tp.table(Transaction);
        let transaction = transactionTable.by('id', <any> this.transactionId);
        if (!transaction.x.reconciliationRecords) transaction.x.reconciliationRecords = []; 
        transaction.x.reconciliationRecords.push(t);
        this.updateTransactionReconciliationFlags(transaction);
        transactionTable.update(transaction);

        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        if (!bankTransaction.x.reconciliationRecords) bankTransaction.x.reconciliationRecords = []; 
        bankTransaction.x.reconciliationRecords.push(t);
        this.updateBankTransactionReconciliationFlags(bankTransaction);
        bankTransactionTable.update(bankTransaction);


        table.insert(t);

        tp.mapTransactionAndRecord(this, t);
    }

    update(tp: TransactionProcessor) {
        let table = tp.table(TransactionReconciliation);
        let t = table.by('id', <any> (this.id * 100000));

        if (t.transactionId !== this.transactionId || t.bankTransactionId !== this.bankTransactionId) {
            tp.unsupported();
        }

        t.amount = this.amount;

        let transactionTable = tp.table(Transaction);
        let transaction = transactionTable.by('id', <any> this.transactionId);
        this.updateTransactionReconciliationFlags(transaction);
        transactionTable.update(transaction);

        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        this.updateBankTransactionReconciliationFlags(bankTransaction);
        bankTransactionTable.update(bankTransaction);

        table.update(t);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(TransactionReconciliation);
        let t = table.by('id', <any> (this.id * 100000));
        table.remove(t);

        let transactionTable = tp.table(Transaction);
        let transaction = transactionTable.by('id', <any> this.transactionId);
        transaction.x.reconciliationRecords.splice(transaction.x.reconciliationRecords.indexOf(t), 1);
        this.updateTransactionReconciliationFlags(transaction);
        transactionTable.update(transaction);

        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        bankTransaction.x.reconciliationRecords.splice(bankTransaction.x.reconciliationRecords.indexOf(t), 1);
        this.updateBankTransactionReconciliationFlags(bankTransaction);
        bankTransactionTable.update(bankTransaction);

        tp.unmapTransactionAndRecord(this, t);

    }

    updateTransactionReconciliationFlags(transaction: Transaction) {
        let reconTotal = transaction.x.reconciliationRecords.reduce((tot, t) => tot.plus(t.amount), new Big('0'));
        transaction.x.reconciled = reconTotal.eq(transaction.amount);
    }

    updateBankTransactionReconciliationFlags(bankTransaction: BankTransaction) {
        let reconTotal = bankTransaction.x.reconciliationRecords.reduce((tot, t) => tot.plus(t.amount), new Big('0'));
        bankTransaction.x.reconciled = reconTotal.eq(bankTransaction.amount);
    }
    
    deserialize(field: string, value: any): any {
        if (field === 'amount')
            return new Big(value);
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        if (env.action === 'apply') {
            return "Reconciled";
        } else if (env.action === 'update') {
            return "Reconciled";
        } else {
            return "Unreconciled";
        } 
    }


}

