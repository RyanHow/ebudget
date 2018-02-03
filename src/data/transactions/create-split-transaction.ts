import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {Transaction} from '../records/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import { Big } from 'big.js';
import { AccountTransaction } from "../records/account-transaction";
import { Logger } from "../../services/logger";

/**
 * Think of this like multiple linked budget transactions. It is in a single DbTransaction
 * so we can operate on it atomically - eg. delete the group of transactions, add it as a
 * single group of transactions. They don't really make sense to have them reside individually.
 * 
 * For Example: A TV is purchased, but needs to be accounted for in multiple categories,
 * or under multiple accounts. eg. a Cash payment and a bank account payment. This TV may
 * also go under 2 different accounts (eg. some of it was to replace an old broken TV and
 * comes under the maintenance, but it was an upgrade and some comes from savings).
 * 
 */
export class CreateSplitTransaction extends DbTransaction {

    description: string;
//    status?: 'realised' | 'anticipated';
    date: string;
    amounts: Array<{
        amount: Big;
        categoryId: number;
    }>;
    accountAmounts: Array<{
        amount: Big;
        accountId: number;
    }>;

    getTypeId(): string {
        return 'CreateSplitTransaction';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation account amount total = category amount total


        let transactionTable = tp.table(Transaction);
        let accountTransactionTable = tp.table(AccountTransaction);
        
        let categoryTotal = new Big('0');
        let accountTotal = new Big('0');


        for (let i = 0; i < this.amounts.length; i++) {
            let t = new Transaction();
            t.id = this.id * 100000 + i;
            t.amount = this.amounts[i].amount;
            t.date = this.date;
            t.description = this.description;  
            t.categoryId = this.amounts[i].categoryId;

            transactionTable.insert(t);        
            tp.mapTransactionAndRecord(this, t);

            categoryTotal = categoryTotal.plus(t.amount);
        }

        if (this.accountAmounts) for (let i = 0; i < this.accountAmounts.length; i++) {
            let t = new AccountTransaction();
            t.id = this.id * 100000 + i;
            t.amount = this.accountAmounts[i].amount;
            t.date = this.date;
            t.description = this.description;  
            t.accountId = this.accountAmounts[i].accountId;

            accountTransactionTable.insert(t);
            tp.mapTransactionAndRecord(this, t);

            accountTotal = accountTotal.plus(t.amount);
        }

        if (accountTotal.gt(categoryTotal)) {
            // TODO: Validation exception - account total cannot be greater than category total - don't process it, how to tell the user? - they need to acknowledge and then skip it next time ?
            Logger.get('CreateSplitTransaction').info('Account Total > Category Total for transaction id ' + this.id);

        } else if (accountTotal.lt(categoryTotal)) {

            let accountDiff = categoryTotal.minus(accountTotal);

            let t = new AccountTransaction();
            t.id = this.id * 100000 + 99999;
            t.amount = accountDiff
            t.date = this.date;
            t.description = this.description;  

            accountTransactionTable.insert(t);
            tp.mapTransactionAndRecord(this, t);

            accountTotal = accountTotal.plus(t.amount);
        }

        
        
    }

    update(tp: TransactionProcessor) {
        // Just remove everything and add it all again
        // TODO: This won't handle triggering certain category recalcs (but at the moment that doesn't matter...)

        this.undo(tp);
        this.apply(tp);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(Transaction);

        tp.findAllRecordsForTransaction(this).slice().forEach((t) => {            
            table.remove(<Transaction> t);
            tp.unmapTransactionAndRecord(this, t);
        });
    }

    
    deserialize(field: string, value: any): any {
        if (field === 'amounts') {
            value.forEach(line => {
                line.amount = new Big(line.amount);
            });
        }
        if (field === 'accountAmounts') {
            value.forEach(line => {
                line.amount = new Big(line.amount);
            });
        }
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        let total = env.currencyFormatter(this.amounts.map((l) => l.amount).reduce((a, b) => a.plus(b)));
        if (env.action === 'apply') {
            return "Added " + this.description + " of " + total;
        } else if (env.action === 'update') {
            return "Updated " + this.description + " to " + total;
        } else {
            return "Deleted " + this.description + " of " + total;
        } 
    }


}

