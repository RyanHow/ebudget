import moment from "moment";
import { Transaction } from "../data/records/transaction";
import { InitCategorySimpleWeeklyTransaction } from "../data/transactions/init-category-simple-weekly-transaction";
import { InitCategoryTransaction } from "../data/transactions/init-category-transaction";
import { Utils } from "../services/utils";
import { Engine } from "./engine";
import { Big } from 'big.js';

export class Exporter {
    
    constructor(private engine: Engine) {

    }

    downloadAllTransactions() {
        let allTransactions = this.getAllTransactions();
        var csv = '"date","category","description","amount"\n';
        allTransactions.forEach(t => {
            csv += moment(t.date).format('YYYY-MM-DD') + ',', 
            csv += '"' + t.category + '",',
            csv += '"' + t.description + '",',
            csv += t.amount,
            csv += '\n';
        });

        var blob = new Blob([csv], { type: 'text/csv' });

        var a = document.createElement('a');
        a.download = 'budget-transactions.csv';
        a.href = URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/csv', a.download, a.href].join(':');
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(a.href); }, 40000);
    }

    getAllTransactions() {

        let transactions = this.engine.db.transactionProcessor.table(Transaction).data;
        let categoryWeeklyAmounts: { [categoryId: number]: InitCategorySimpleWeeklyTransaction[]; } = { };


        let allTransactions : {
            date: string;
            amount: number;
            description: string;
            category: string;
        }[] = [];

        let categories = this.engine.db.sortedTransactions.data().filter(dbTransaction => dbTransaction.getTypeId() === new InitCategoryTransaction().getTypeId()) as InitCategoryTransaction[];
        let currentWeeklyAmounts = this.engine.db.sortedTransactions.data().filter(dbTransaction => dbTransaction.getTypeId() === new InitCategorySimpleWeeklyTransaction().getTypeId()) as InitCategorySimpleWeeklyTransaction[];

        currentWeeklyAmounts.forEach(t => {
            categoryWeeklyAmounts[t.categoryId] = t.x.repl.map(replRecord => replRecord.transaction).sort((a,b) => a.balanceDate.localeCompare(b.balanceDate));
        });

        // Deleted categories end with a 0 balance
        categories.filter(t => t.deleted).forEach(t => {
            let deletedTimestamp = Math.max(...(t.x.repl.map(r => r.timestamp) as number[]));
            let zeroBalanceWeekly = new InitCategorySimpleWeeklyTransaction();
            zeroBalanceWeekly.balanceDate = moment(deletedTimestamp).add(1, 'day').format('YYYYMMDD');
            zeroBalanceWeekly.balance = new Big(0);
            zeroBalanceWeekly.categoryId = t.id;
            zeroBalanceWeekly.weeklyAmount = new Big(0);
            categoryWeeklyAmounts[t.id].push(zeroBalanceWeekly);
        });

        // Insert a start weekly amount in categories (to simplify)
        categories.forEach(t => {
            let zeroBalanceWeekly = new InitCategorySimpleWeeklyTransaction();
            zeroBalanceWeekly.balanceDate = '20170101';
            zeroBalanceWeekly.balance = new Big(0);
            zeroBalanceWeekly.categoryId = t.id;
            zeroBalanceWeekly.weeklyAmount = new Big(0);
            categoryWeeklyAmounts[t.id].unshift(zeroBalanceWeekly);
        });

 
        transactions.forEach(t => {
            allTransactions.push({
                date: t.date,
                amount: -Number.parseFloat(t.amount.toFixed(2)),
                description: t.description,
                category: categories.find(c => c.id === t.categoryId).categoryName
            });
        });

        categories.forEach(category => {
            let startDate = '20180101';
            let runningBalance = new Big(0);
            for (let i = 0; i < categoryWeeklyAmounts[category.id].length; i++) {
                let weeklyAmount = new Big(categoryWeeklyAmounts[category.id][i].weeklyAmount);
                let periodStartBalance = new Big(categoryWeeklyAmounts[category.id][i].balance);
                let periodStartDate = categoryWeeklyAmounts[category.id][i].balanceDate;
                let isLast = categoryWeeklyAmounts[category.id].length - 1 == i;
                let cutoffDate = isLast ? moment().add(1, 'day').format('YYYYMMDD') : categoryWeeklyAmounts[category.id][i + 1].balanceDate;
                
                if (!periodStartBalance.eq(runningBalance)) {
                    // Insert any balance shift for the running balance
                    allTransactions.push({
                        date: periodStartDate,
                        amount: Number.parseFloat(periodStartBalance.minus(runningBalance).toFixed(2)),
                        description: 'Balance Adjustment',
                        category: category.categoryName
                    });        

                    runningBalance = periodStartBalance;
                }
                
                let periodTransactions = transactions.filter(t => 
                    t.categoryId === category.id &&
                    t.date < cutoffDate &&
                    t.date >= startDate
                );

                periodTransactions.forEach(t => {
                    runningBalance = runningBalance.minus(t.amount);
                });

                // Iterate by week and insert the weekly amount
                if (weeklyAmount.gt(new Big(0))) {
                    let weeklyAmountDate = moment(periodStartDate, 'YYYYMMDD').startOf('week').add(1, 'week');
                    while (weeklyAmountDate.isBefore(cutoffDate)) {
                        allTransactions.push({
                            date: weeklyAmountDate.format('YYYYMMDD'),
                            amount: Number.parseFloat(weeklyAmount.toFixed(2)),
                            description: 'Weekly Allocation',
                            category: category.categoryName
                        });        
                        weeklyAmountDate = weeklyAmountDate.add(1, 'week');
                        runningBalance = runningBalance.plus(weeklyAmount);
                    }
                }

                startDate = cutoffDate;
            }
        });

        allTransactions = allTransactions.sort((a, b) => a.date.localeCompare(b.date));
            
        return allTransactions;
    }




}