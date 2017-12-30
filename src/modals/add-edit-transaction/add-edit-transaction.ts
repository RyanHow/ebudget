import {NavController, ViewController, NavParams, AlertController} from 'ionic-angular';
import {Db} from '../../db/db';
import {Category} from '../../data/records/category';
import {Transaction} from '../../data/records/transaction';
import {Dbms} from '../../db/dbms';
import {InitSimpleTransaction} from '../../data/transactions/init-simple-transaction';
import {Configuration} from '../../services/configuration-service';
import {Component} from '@angular/core';
import {Utils} from '../../services/utils';
import { Big } from 'big.js';

@Component({
  templateUrl: 'add-edit-transaction.html'
})
export class AddEditTransactionModal {

  data: { expense: boolean; date?: string; description?: string; amount?: string } = {expense: true};

  budget: Db;
  editing: boolean;
  category: Category;
  transaction: InitSimpleTransaction;
  
  constructor(private configuration: Configuration, public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController) {
    this.viewCtrl = viewCtrl;
    this.nav = nav;
    
    this.budget = dbms.getDb(navParams.data.budgetId);
    this.category = this.budget.transactionProcessor.table(Category).by('id', navParams.data.categoryId);

    if (navParams.data.transactionId) {
      this.editing = true;
      let transactionRecord = this.budget.transactionProcessor.table(Transaction).by('id', navParams.data.transactionId);
      this.transaction = this.budget.transactionProcessor.findTransactionsForRecord(transactionRecord, InitSimpleTransaction)[0];

      this.data.date = Utils.toIonicFromYYYYMMDD(this.transaction.date);
      if (this.transaction.amount.cmp(Big(0)) < 0) {
        this.data.expense = false;
        this.data.amount = this.transaction.amount.times(-1).toString();
      } else {
        this.data.amount = this.transaction.amount.toString();
      }
      this.data.description = this.transaction.description;
    } else {
      this.editing = false;
      this.data.date = Utils.nowIonic();
    }
    
  }
    
  submit(event: Event) {
    event.preventDefault();

    var t: InitSimpleTransaction;
    if (! this.editing) {
      t = new InitSimpleTransaction();
    } else {
      t = this.transaction;
    }    
    
    t.amount = new Big((this.data.amount).replace(',', ''));
    if (!this.data.expense) {
      t.amount = t.amount.times(-1);
    }
    t.date = Utils.toYYYYMMDDFromIonic(this.data.date);
    t.description = this.data.description;
    t.categoryId = this.category.id;
    this.budget.applyTransaction(t);

    this.viewCtrl.dismiss();
  }
  
  cancel() {
    this.viewCtrl.dismiss();    
  }
  
  deleteTransactionConfirm() {
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this transaction?',
      buttons: [
        {
          text: 'Cancel'
        } , {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirm.dismiss().then(() => {
              this.deleteTransaction();
            });
            return false;
          }
        }
      ]
    });

    confirm.present();
  }
  
  deleteTransaction() {
    this.budget.deleteTransaction(this.transaction);
    
    this.viewCtrl.dismiss();
  }
  
  toggleExpense() {
    this.data.expense = !this.data.expense;
  }
} 