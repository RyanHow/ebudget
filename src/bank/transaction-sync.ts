import {Injectable} from '@angular/core';
import {BankAccountTransaction} from './provider-interface';
import {Logger} from '../services/logger';
import {BankTransaction} from '../data/records/bank-transaction';
import {Account} from '../data/records/account';
import {MergeBankTransactions} from '../data/transactions/merge-bank-transactions';
import Big from 'big.js';
import {Engine} from '../engine/engine';
import {Utils} from '../services/utils';

class AccountTransactionProcessing extends BankAccountTransaction {
    amountBig: BigJsLibrary.BigJS;
    matched: boolean;
    matchedAccountTransaction: BankTransaction;
}

@Injectable()
export class TransactionSync {

    private logger = Logger.get('TransactionSync');

    merge(engine: Engine, account: Account, bankAccountTransactions: BankAccountTransaction[]) {

        //TODO: The page for viewing them
        //TODO: A "clear" button for the bank transactions

        let inTransactions = <AccountTransactionProcessing[]> bankAccountTransactions;

        let sortMap = {'authorised': 3, 'recent': 2, 'processed': 1};

        inTransactions.sort((a, b) => 
            sortMap[a.status] - sortMap[b.status] || Number(b.transactionDate || '0') - Number(a.transactionDate || '0')
        );

        let minDate = Math.min.apply(null, inTransactions.filter(t => t.transactionDate).map(t => Number(t.transactionDate)));

        let existingBankTransactions = engine.db.transactionProcessor.table(BankTransaction).find()
        .filter(t => t.accountId === account.id && ((t.status === 'authorised' && t.date >= minDate) || t.status !== 'authorised'))
        .sort((a, b) => 
            sortMap[a.status] - sortMap[b.status] || Number(b.date || '0') - Number(a.date || '0') || b.id - a.id
        );

        inTransactions.forEach(t => {
            // TODO: Any kind of description filtering !?
            t.amountBig = new Big(t.amount);
        });



        /*

        Note: I don't think the contiguous idea is going to work, we are just going to match and remove. Matched we will udpate if needed, Unmatched we will add. We can't detect what we may need to remove.

        // To summarise. We are matching processed to existing processed records first, they should be in a contiguous block originally. Any left unmatched will be added.
        // Then we are matching processed to formerly authorised or recent. These will be updated.
        // Then we are matching authorised or recent to existing authorised or recent. Any left unmatched will be added.

        let existingBankTransactionsProcessed = existingBankTransactions.filter(t => t.status === 'processed');
        let existingBankTransactionsNotProcessed = existingBankTransactions.filter(t => t.status !== 'processed');

        let lastMatchedProcessedIndex = -1; // Means last record was not matched...
        let hasMatched = false;
        inTransactions.filter(t => t.status === 'processed').forEach(t => {
            let {record, index} = this.findFirstMatch(t, existingBankTransactionsProcessed, lastMatchedProcessedIndex + 1);
            let noMatch = index == -1;
            let error = index == -2;
            let thisMatch = record && true;
            hasMatched = hasMatched || thisMatch;

            if (thisMatch) {
                let isNextIndex = lastMatchedProcessedIndex == -1 || index === lastMatchedProcessedIndex + 1;

                if (!isNextIndex) {
                    // We have an issue...
                }
            
                t.matched = true;
                t.matchedAccountTransaction = record;
                lastMatchedProcessedIndex = index;
            }

            if (!thisMatch) {
                // Maybe this was previoulsy an authorised or pending one
                let {record, index} = this.findFirstMatch(t, existingBankTransactionsNotProcessed);
                if (index >= 0) {
                    t.matched = true;
                    t.matchedAccountTransaction = existingBankTransactionsNotProcessed.splice(index, 1)[0];
                }
            }
            
        });


        inTransactions.filter(t => t.status !== 'processed' && ! t.matched).forEach(t => {
            let {record, index} = this.findFirstMatch(t, existingBankTransactionsNotProcessed);
            if (index >= 0) {
                t.matched = true;
                t.matchedAccountTransaction = existingBankTransactionsNotProcessed.splice(index, 1)[0];
            }        
        });

        */

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


        // TODO: Do another check of toAdd to unmatchedExistingRecords and check for same amount, but different date OR description ??? - Only do this if real world evidence suggests any discrepency which results in an add/remove rather than update

        // Now we want unmatched to add, matched to update if to pending / authorised
        let toUpgrade = inTransactions.filter(t => t.matched && t.status !== t.matchedAccountTransaction.status);
        let toAdd = inTransactions.filter(t => !t.matched);
        // TODO unflag if they reappear ? - this will be in the match/remove - we just do a "flag" operation again, but to wipe it...

        let toFlag = unmatchedExistingRecords.filter(t => !t.flagRemoved).map(t=> {return {bankTransactionId: t.id, flag: 'removed', set: true};})
                    .concat(inTransactions.filter(t => t.matched && t.matchedAccountTransaction.flagRemoved).map(t=> {return {bankTransactionId: t.matchedAccountTransaction. id, flag: 'removed', set: undefined};}));

        if (toUpgrade.length || toAdd.length || toFlag.length) {

            let mergeBankTransactions = new MergeBankTransactions();
            mergeBankTransactions.accountId = account.id;
            
            if (toUpgrade)
                mergeBankTransactions.inserts = toAdd.map(t => {return {date: t.transactionDate || Utils.nowYYYYMMDD(), status: t.status, description: t.description, amount: t.amountBig};});
            
            if (toAdd)
               mergeBankTransactions.upgrades = toUpgrade.map(t => {return {bankTransactionId: t.matchedAccountTransaction.id, date: t.transactionDate, status: t.status, description: t.description, amount: t.amountBig};});
            
            if (toFlag)
                mergeBankTransactions.flags = toFlag;
                

            mergeBankTransactions.generateChecksum(engine.db.transactionProcessor);

            engine.db.applyTransaction(mergeBankTransactions);

        } else {
            // TODO: Notify that there is nothing new to sync, already up to date, or return a message as such...

        }

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
            // Authorised - match : status = 'recent', description & amount - full record
            i = accountTransactions.findIndex(t => 
                t.status === 'recent' && t.amount.eq(inTransaction.amountBig) && t.description == inTransaction.description
            );
        } else {
            // error TODO
        }

        return {record: i >= 0 ? accountTransactions[i]: null, index: i >= 0 ? i + fromIndex : i};

    }

}