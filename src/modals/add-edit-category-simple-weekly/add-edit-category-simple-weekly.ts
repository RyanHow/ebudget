import {NavController, ViewController, NavParams} from 'ionic-angular';
import {Db} from '../../db/db';
import {Category} from '../../data/records/category';
import {Transaction} from '../../data/records/transaction';
import {Dbms} from '../../db/dbms';
import {InitCategorySimpleWeeklyTransaction} from '../../data/transactions/init-category-simple-weekly-transaction';
import {Component} from '@angular/core';
import {Utils} from '../../services/utils';
import Big from 'big.js';

@Component({
  templateUrl: 'add-edit-category-simple-weekly.html'
})
export class AddEditCategorySimpleWeeklyModal {
  budget: Db;
  category: Category;
  transaction: InitCategorySimpleWeeklyTransaction;

  balance: any;
  weeklyAmount: any;
  balanceDate: string;
  
  constructor(public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController) {
    this.viewCtrl = viewCtrl;
    this.nav = nav;
    
    this.budget = dbms.getDb(navParams.data.budgetId);
    this.category = this.budget.transactionProcessor.table(Category).by('id', navParams.data.categoryId);
    this.transaction = this.budget.transactionProcessor.findTransactionsForRecord(this.category, InitCategorySimpleWeeklyTransaction)[0];

    this.balanceDate = Utils.nowIonic();

    if (!this.transaction) {
      this.transaction = new InitCategorySimpleWeeklyTransaction();
      this.transaction.categoryId = this.category.id;
    } else {
      this.balance = this.category.balance;
      this.weeklyAmount = this.transaction.weeklyAmount;
    }

  }
  
  submit(event: Event) {
    event.preventDefault();

    // TODO: Get the sum of transactions with date of TODAY
    // Subtract from the balance here
    this.transaction.balanceDate = Utils.toYYYYMMDDFromIonic(this.balanceDate);

    let todaysTotal = this.budget.transactionProcessor.table(Transaction).chain()
      .find({'categoryId' : this.category.id}).find({'date' : { '$gte' : this.transaction.balanceDate}}).mapReduce(t => t.amount, tt => tt.length === 0 ? new Big(0) : tt.reduce((a, b) => a.plus(b)));
        
    this.transaction.balance =  new Big(this.balance).plus(todaysTotal);
    this.transaction.weeklyAmount =  new Big(this.weeklyAmount);
    this.budget.applyTransaction(this.transaction);

    this.viewCtrl.dismiss();
  }
  
  cancel() {
    this.viewCtrl.dismiss();    
  }


} 