import {Injectable} from '@angular/core';
import {BankAccountTransaction, BankAccount} from './provider-interface';
import {Logger} from '../services/logger';
import {BankTransaction} from '../data/records/bank-transaction';
import {Account} from '../data/records/account';
import {MergeBankTransactions} from '../data/transactions/merge-bank-transactions';
import { Big } from 'big.js';
import {Engine} from '../engine/engine';
import {Utils} from '../services/utils';

class AccountTransactionProcessing extends BankAccountTransaction {
    originalIndex: number;
    amountBig: Big;
    balanceBig: Big;
    balanceCheck: boolean;
    matched: boolean;
    matchedAccountTransaction: BankTransaction;
    balanceSequence: number;
}

@Injectable()
export class TransactionSync {

    private logger = Logger.get('TransactionSync');

    merge(engine: Engine, account: Account, bankAccount: BankAccount, bankAccountTransactions: BankAccountTransaction[]) {

        //TODO: The page for viewing them
        //TODO: A "clear" button for the bank transactions

        let inTransactions = <AccountTransactionProcessing[]> bankAccountTransactions;
        for (let i = 0; i < inTransactions.length; i++) inTransactions[i].originalIndex = i;

        let sortMap = {'authorised': 3, 'recent': 2, 'processed': 1};

        inTransactions.sort((a, b) => 
            sortMap[a.status] - sortMap[b.status] || Number(a.transactionDate || '0') - Number(b.transactionDate || '0') || a.originalIndex - b.originalIndex
        );

        let minDate = Math.min.apply(null, inTransactions.filter(t => t.transactionDate).map(t => Number(t.transactionDate)));

        let existingBankTransactions = engine.db.transactionProcessor.table(BankTransaction).find()
        .filter(t => t.accountId === account.id && ((t.status === 'authorised' && t.date >= minDate) || t.status !== 'authorised'))
        .sort((a, b) => 
            sortMap[a.status] - sortMap[b.status] || Number(a.date || '0') - Number(b.date || '0') || a.id - b.id
        );

        inTransactions.forEach(t => {
            // TODO: Any kind of description filtering !?
            t.amountBig = new Big(t.amount);
            if (t.balance) t.balanceBig = new Big(t.balance);
        });

        let lastTransaction = <AccountTransactionProcessing> null;
        let daySequence = 0;
        inTransactions.filter(t => t.status === 'processed').forEach(t => {
            if (!lastTransaction || lastTransaction.transactionDate !== t.transactionDate) daySequence = 0;
            t.balanceSequence = Number(t.transactionDate) * 10000 + daySequence;
            t.balanceCheck = !lastTransaction || lastTransaction.balanceBig.plus(t.amountBig).eq(t.balanceBig);
            if (!t.balanceCheck) this.logger.info("Balance sequence check failed", lastTransaction, t);
            daySequence++;
            lastTransaction = t;
        });


        inTransactions.forEach(t => {
            let {index} = this.findFirstMatch(t, existingBankTransactions);
            if (index >= 0) {
                t.matched = true;
                t.matchedAccountTransaction = existingBankTransactions.splice(index, 1)[0];
            }        
        });


        let unmatchedExistingRecords = existingBankTransactions.filter(t => t.status !== 'processed');
        let minMatchedDate = Math.min.apply(null, inTransactions.filter(t => t.status === 'processed' && t.matched).map(t => Number(t.transactionDate)));
        if (minMatchedDate !== Infinity && minMatchedDate !== NaN && minMatchedDate > 0) {
            unmatchedExistingRecords = unmatchedExistingRecords.concat(existingBankTransactions.filter(t => t.status === 'processed' && t.date > minMatchedDate));
        }

        // TODO: CHECK THE BALANCES AND SEQUENCES HAVEN'T CHANGED (OR USE THEM AS PART OF THE MATCHING PROCESS ??)

        // TODO: Do another check of toAdd to unmatchedExistingRecords and check for same amount, but different date OR description ??? - Only do this if real world evidence suggests any discrepency which results in an add/remove rather than update

        // Now we want unmatched to add, matched to update if to pending / authorised
        let toUpgrade = inTransactions.filter(t => t.matched && t.status !== t.matchedAccountTransaction.status);
        let toAdd = inTransactions.filter(t => !t.matched);

        let toFlag = unmatchedExistingRecords.filter(t => !t.flagRemoved).map(t=> {return {bankTransactionId: t.id, flag: 'removed', set: true};})
                    .concat(inTransactions.filter(t => t.matched && t.matchedAccountTransaction.flagRemoved).map(t=> {return {bankTransactionId: t.matchedAccountTransaction. id, flag: 'removed', set: undefined};}));

        let mergeBankTransactions = new MergeBankTransactions();
        mergeBankTransactions.accountId = account.id;
        
        if (toUpgrade)
            mergeBankTransactions.inserts = toAdd.map(t => {return {date: t.transactionDate || Utils.nowYYYYMMDD(), status: t.status, description: t.description, amount: t.amountBig, balance: t.balanceBig, balanceSequence: t.balanceSequence};});
        
        if (toAdd)
            mergeBankTransactions.upgrades = toUpgrade.map(t => {return {bankTransactionId: t.matchedAccountTransaction.id, date: t.transactionDate, status: t.status, description: t.description, amount: t.amountBig, balance: t.balanceBig, balanceSequence: t.balanceSequence};});
        
        if (toFlag)
            mergeBankTransactions.flags = toFlag;

        if (account.x.bankBalance + '' !== bankAccount.accountBalance + '') mergeBankTransactions.accountBalance = new Big(bankAccount.accountBalance);
        if (account.x.bankAvailableBalance + '' !== bankAccount.accountAvailableBalance + '') mergeBankTransactions.accountAvailableBalance = new Big(bankAccount.accountAvailableBalance);

        if (toUpgrade || toAdd || toFlag || mergeBankTransactions.accountBalance || mergeBankTransactions.accountAvailableBalance) mergeBankTransactions.generateChecksum(engine.db.transactionProcessor);

        mergeBankTransactions.timestamp = new Date().toISOString();


        engine.db.applyTransaction(mergeBankTransactions);


    }

    findFirstMatch(inTransaction: AccountTransactionProcessing, accountTransactions: BankTransaction[], fromIndex: number = 0): {record: BankTransaction; index: number} {

        let i = -2;
        accountTransactions = accountTransactions.slice(fromIndex);

        if (inTransaction.status === 'processed') {
            // Processed - match : Date, status, description & amount - full record, or a record upgrade (see comments inline)
            i = accountTransactions.findIndex(t => 
                (t.status === 'processed' && t.amount.eq(inTransaction.amountBig) && t.date === inTransaction.transactionDate && t.description == inTransaction.description)
                || (t.status === 'recent' && t.amount.eq(inTransaction.amountBig)) // Not sure on description ? // Date >= ?, or within tolerance ?
                || (t.status === 'authorised' && t.amount.eq(inTransaction.amountBig) && t.date <= inTransaction.transactionDate) // Processed date >= authorised date
            );

        } else if (inTransaction.status === 'authorised') {
            // Authorised - match : Date, status = 'authorised', description & amount - full record
            i = accountTransactions.findIndex(t => 
                t.status === 'authorised' && t.amount.eq(inTransaction.amountBig) && t.date === inTransaction.transactionDate && t.description == inTransaction.description
            );
        } else if (inTransaction.status === 'recent') {
            // Recent - match : status = 'recent' | 'authorised', description & amount - full record
            i = accountTransactions.findIndex(t => 
                (t.status === 'recent' && t.amount.eq(inTransaction.amountBig) && t.description == inTransaction.description)
                || (t.status === 'authorised' && t.amount.eq(inTransaction.amountBig))
            );
        } else {
            // error TODO
        }

        return {record: i >= 0 ? accountTransactions[i]: null, index: i >= 0 ? i + fromIndex : i};

    }

}