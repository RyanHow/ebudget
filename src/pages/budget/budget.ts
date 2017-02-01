import {NavController, NavParams, ModalController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Db} from '../../db/db';
import {Category} from '../../data/records/category';
import {CategoryPage} from '../../pages/category/category';
import {Budget} from '../../data/records/budget';
import {AddEditCategoryModal} from '../../modals/add-edit-category/add-edit-category';
import {EngineFactory} from '../../engine/engine-factory';
import {Configuration} from '../../services/configuration-service';
import {InitCategorySimpleWeeklyTransaction} from '../../data/transactions/init-category-simple-weekly-transaction';

@Component({
  templateUrl: 'budget.html'
})
export class BudgetPage {
  budget: Db;
  budgetRecord: Budget;
  categories: Category[];
  
  constructor(private nav: NavController, private dbms: Dbms, private params: NavParams, private engineFactory: EngineFactory, private modalController: ModalController, private configuration: Configuration) {
    this.nav = nav;
    this.dbms = dbms;
    
    this.budget = this.params.data.budget;
    engineFactory.getEngine(this.budget);
    this.budget.activate();
    
    this.categories = this.budget.transactionProcessor.table(Category).data;
    this.budgetRecord = this.budget.transactionProcessor.single(Budget);
  }
  
  addCategory() {
    let modal = this.modalController.create(AddEditCategoryModal);
    modal.data.budgetId = this.budget.id;

    modal.present();

  }
  
  openCategory(category: Category) {
    this.nav.push(CategoryPage, {'budget': this.budget, 'categoryId': category.id});
  }
  
  categoryWeeklyAmount(category: Category): any {
    // TODO Very inefficient way to get a value in angular
    let t = InitCategorySimpleWeeklyTransaction.getFrom(this.budget, category);
    if (t) return t.weeklyAmount;
  }


  ionViewDidLeave() {
    // TODO: CHeck this is called appropriately (ie. on a different setRoot(), but not on navigating to a child page)
   // this.budget.deactivate();
  }

  ionViewDidEnter() {
    this.configuration.lastOpenedBudget(this.budget.id);
  }
  


}