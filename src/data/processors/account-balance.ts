import {Processor} from '../../engine/processor';
import moment from 'moment';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Account} from '../records/account';
import {Category} from '../records/category';
import {Transaction} from '../records/transaction';
import { Big } from 'big.js';
import { Utils } from "../../services/utils";

export class AccountBalanceProcessor extends Processor {
    
    constructor(public account: Account) {
        super();
    }
    
    getTypeId(): String {
        return 'AccountBalance';
    }
        
    execute(tp: TransactionProcessor) {

        let currentDate = Utils.nowYYYYMMDD();

        let categoriesMap = new Map<number, Category>();
        let categoryTable = tp.table(Category);
        categoryTable.data.forEach(c => {
            categoriesMap.set(c.id, c);
            if (!c.x.accountBalances) c.x.accountBalances = new Map<number, Big>();
            c.x.accountBalances.clear();
        });
        let accountTransactions = <Transaction[]> <any> tp.table(Transaction).find({'accountId': this.account.id});
        this.account.balance = accountTransactions.filter(t => !t.status || (t.status === 'realised' && t.date >= currentDate)).reduce((total, transaction) => {

            let accountBalances = categoriesMap.get(transaction.categoryId).x.accountBalances;
            let categoryTotal = accountBalances.get(transaction.accountId || null) || new Big("0")
            accountBalances.set(transaction.accountId || null, categoryTotal.minus(transaction.amount));

            return total.minus(transaction.amount);
        }, this.account.initialBalance || new Big('0'));
        
        tp.table(Account).update(this.account);
        categoryTable.data.forEach(c => categoryTable.update(c));

    }
        
}