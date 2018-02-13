import {Processor} from '../../engine/processor';
import moment from 'moment';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Account} from '../records/account';
import {Category} from '../records/category';
import {Transaction} from '../records/transaction';
import { Big } from 'big.js';
import { Utils } from "../../services/utils";
import { Logger } from "../../services/logger";
import { AccountTransaction } from "../records/account-transaction";
import { BankLink } from "../records/bank-link";
import { BankTransaction } from "../records/bank-transaction";

export class AccountBalanceProcessor extends Processor {
    
    constructor(public account: Account) {
        super();
    }
    
    getTypeId(): String {
        return 'AccountBalance';
    }
        
    execute(tp: TransactionProcessor) {

        let categoriesMap = new Map<number, Category>();
        let accountTransactionTable = tp.table(AccountTransaction);

        let accountTransactions = <AccountTransaction[]> <any> tp.table(AccountTransaction).find({'accountId': this.account.id});
        this.account.balance = accountTransactions.reduce((total, accountTransaction) => total.minus(accountTransaction.amount), this.account.initialBalance || new Big('0'));
        if (this.account.bankLinkId) {
            this.account.x.unreconciledCount = accountTransactions.reduce((total, accountTransaction) => total += accountTransaction.x.reconciled ? 0 : 1, 0);
            let bankAccountTransactions = <BankTransaction[]> <any> tp.table(BankTransaction).find({'accountId': this.account.id});
            this.account.x.bankUnreconciledCount = bankAccountTransactions.filter(t => !t.x.ignored && !t.x.reconciled).length;
        }

        tp.table(Account).update(this.account);

    }
        
}