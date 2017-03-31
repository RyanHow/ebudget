import {NavController, ViewController, NavParams, AlertController} from 'ionic-angular';
import {Db} from '../../db/db';
import {Category} from '../../data/records/category';
import {Dbms} from '../../db/dbms';
import {InitCategoryTransaction} from '../../data/transactions/init-category-transaction';
import {Component} from '@angular/core';

@Component({
  templateUrl: 'add-edit-category.html'
})
export class AddEditCategoryModal {
  budget: Db;
  editing: boolean;
  category: Category;
  categoryName: string;
  transaction: InitCategoryTransaction;
  
  constructor(public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController) {
    this.viewCtrl = viewCtrl;
    this.nav = nav;
    
    this.budget = dbms.getDb(navParams.data.budgetId);
    
    if (navParams.data.categoryId) {
      this.editing = true;
      this.category = this.budget.transactionProcessor.table(Category).by('id', navParams.data.categoryId);
      this.categoryName = this.category.name;
      this.transaction = this.budget.transactionProcessor.findTransactionsForRecord(this.category, InitCategoryTransaction)[0];
    } else {
      this.editing = false;
    }
    
  }
  
  submit(event: Event) {
    event.preventDefault();

    var t;
    if (! this.editing) {
      t = new InitCategoryTransaction();
    } else {
      t = this.transaction;
    }
    
    t.categoryName = this.categoryName;
    this.budget.applyTransaction(t);

    this.viewCtrl.dismiss();
  }
  
  cancel() {
    this.viewCtrl.dismiss();    
  }
  
  deleteCategoryConfirm() {
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this category and everything in it?',
      buttons: [
        {
          text: 'Cancel'
        } , {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirm.dismiss().then(() => {
              this.deleteCategory();
            });
            return false;
          }
        }
      ]
    });

    confirm.present();
  }
  
  deleteCategory() {
    this.budget.deleteTransaction(this.transaction);
    
    this.viewCtrl.dismiss().then(() => {
      this.nav.pop();
    });
  }
} 