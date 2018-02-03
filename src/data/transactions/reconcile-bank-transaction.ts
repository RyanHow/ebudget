import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import { Big } from 'big.js';
import { BankTransaction } from "../records/bank-transaction";
import { Logger } from "../../services/logger";
import { BankTransactionReconciliation } from "../records/bank-transaction-reconciliation";
import { AccountTransaction } from "../records/account-transaction";


/**
 * A bank transaction is reconciled to an account transaction
 * 
 * The amount that is reconciled is specified - generally this should match the amount of the account
 *  transaction or the bank account transaction or else it conceptually gets messy for the user
 * 
 */
export class ReconcileBankTransaction extends DbTransaction {

    accountTransactionId: number;
    bankTransactionId: number;
    amount: Big;
    

    getTypeId(): string {
        return 'TransactionReconciliation';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(BankTransactionReconciliation);
        let t = new BankTransactionReconciliation();
        t.id = this.id * 100000;
        t.amount = this.amount;
        t.accountTransactionId = this.accountTransactionId;
        t.bankTransactionId = this.bankTransactionId; 


        let accountTransactionTable = tp.table(AccountTransaction);
        let accountTransaction = accountTransactionTable.by('id', <any> this.accountTransactionId);
        if (accountTransaction == null) {
            Logger.get('reconcile-bank-transaction').info('Trying to reconcile against deleted transaction. Skipping.');
            return;
        }

        if (!accountTransaction.x.reconciliationRecords) accountTransaction.x.reconciliationRecords = []; 
        accountTransaction.x.reconciliationRecords.push(t);

        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        if (bankTransaction == null) {
            Logger.get('reconcile-bank-transaction').info('Trying to reconcile against deleted bank transaction. Skipping.');
            return;
        }
            
        if (!bankTransaction.x.reconciliationRecords) bankTransaction.x.reconciliationRecords = []; 
        bankTransaction.x.reconciliationRecords.push(t);

        this.updateBankTransactionReconciliationFlags(bankTransaction);
        bankTransactionTable.update(bankTransaction);

        this.updateTransactionReconciliationFlags(accountTransaction);
        accountTransactionTable.update(accountTransaction);

        table.insert(t);

        tp.mapTransactionAndRecord(this, t);
    }

    update(tp: TransactionProcessor) {
        let table = tp.table(BankTransactionReconciliation);
        let t = table.by('id', <any> (this.id * 100000));

        if (t.accountTransactionId !== this.accountTransactionId || t.bankTransactionId !== this.bankTransactionId) {
            tp.unsupported();
        }

        t.amount = this.amount;

        let accountTransactionTable = tp.table(AccountTransaction);
        let accountTransaction = accountTransactionTable.by('id', <any> this.accountTransactionId);
        if (accountTransaction == null) {
            Logger.get('reconcile-bank-transaction').info('Trying to reconcile against deleted transaction. Skipping. TODO: Fix this in undo');
            return;
        }


        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);
        if (bankTransaction == null) {
            Logger.get('reconcile-bank-transaction').info('Trying to reconcile against deleted bank transaction. Skipping. TODO: Fix this in undo');
            return;
        }
        this.updateBankTransactionReconciliationFlags(bankTransaction);
        bankTransactionTable.update(bankTransaction);

        this.updateTransactionReconciliationFlags(accountTransaction);
        accountTransactionTable.update(accountTransaction);

        table.update(t);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(BankTransactionReconciliation);
        let t = table.by('id', <any> (this.id * 100000));
        table.remove(t);

        let accountTransactionTable = tp.table(AccountTransaction);
        let accountTransaction = accountTransactionTable.by('id', <any> this.accountTransactionId);

        accountTransaction.x.reconciliationRecords.splice(accountTransaction.x.reconciliationRecords.indexOf(t), 1);
        this.updateTransactionReconciliationFlags(accountTransaction);
        accountTransactionTable.update(accountTransaction);

        let bankTransactionTable = tp.table(BankTransaction);
        let bankTransaction = bankTransactionTable.by('id', <any> this.bankTransactionId);

        bankTransaction.x.reconciliationRecords.splice(bankTransaction.x.reconciliationRecords.indexOf(t), 1);
        this.updateBankTransactionReconciliationFlags(bankTransaction);
        bankTransactionTable.update(bankTransaction);

        tp.unmapTransactionAndRecord(this, t);

    }

    updateTransactionReconciliationFlags(accountTransaction: AccountTransaction) {
        let reconTotal = accountTransaction.x.reconciliationRecords.reduce((tot, t) => tot.plus(t.amount), new Big('0'));
        accountTransaction.x.reconciled = reconTotal.eq(accountTransaction.amount);
        accountTransaction.x.reconciledRemaining = accountTransaction.amount.minus(reconTotal);
    }

    updateBankTransactionReconciliationFlags(bankTransaction: BankTransaction) {
        let reconTotal = bankTransaction.x.reconciliationRecords.reduce((tot, t) => tot.minus(t.amount), new Big('0')).times(-1);
        bankTransaction.x.reconciled = reconTotal.eq(bankTransaction.amount);
        bankTransaction.x.reconciledRemaining = bankTransaction.amount.minus(reconTotal);
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

