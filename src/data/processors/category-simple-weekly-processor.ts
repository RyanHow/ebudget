import {Processor} from '../../engine/processor';
import moment from 'moment';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Category} from '../records/category';
import {Transaction} from '../records/transaction';
import { Big } from 'big.js';
import { Utils } from "../../services/utils";

export class CategorySimpleWeeklyProcessor extends Processor {
    
    category: Category;
    balanceDate: string;
    weeklyAmount: Big;
    balance: Big;
    transactionId: number;
    
    getTypeId(): string {
        return 'CategorySimpleWeeklyProcessor';
    }
        
    execute(tp: TransactionProcessor) {
        
        let currentDate = Utils.nowYYYYMMDD(); // TODO: Replace with engine current Date ?

        var transactions = <Array<Transaction>> <any> tp.table(Transaction).find({'categoryId': this.category.id});
        var weekDiff, startBalance;
        try {
            weekDiff = moment(this.balanceDate, 'YYYYMMDD').startOf('week').diff(moment(), 'week');
            startBalance = new Big(weekDiff).abs().times(this.weeklyAmount).plus(this.balance);
        } catch (e) {
            throw e;
        }
        this.category.balance = transactions.reduce((a, b) => {
            if (b.date < this.balanceDate) return a;
            return a.minus(b.amount);
        }, startBalance);
        
        tp.table(Category).update(this.category);
    }
    
    // TODO: Trigger when this occurs - transactions changed or the category record changed
    
}