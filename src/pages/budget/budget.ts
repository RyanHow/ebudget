import {NavController, NavParams, ModalController} from 'ionic-angular';
import {Component, ChangeDetectorRef} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Db} from '../../db/db';
import {Category} from '../../data/records/category';
import {CategoryPage} from '../../pages/category/category';
import {Budget} from '../../data/records/budget';
import {AddEditCategoryModal} from '../../modals/add-edit-category/add-edit-category';
import {EngineFactory} from '../../engine/engine-factory';
import {Engine} from '../../engine/engine';
import {Configuration} from '../../services/configuration-service';
import {InitCategorySimpleWeeklyTransaction} from '../../data/transactions/init-category-simple-weekly-transaction';
import {Logger} from '../../services/logger';


@Component({
  templateUrl: 'budget.html'
})
export class BudgetPage {

  private logger: Logger = Logger.get('BudgetPage');

  budget: Db;
  budgetRecord: Budget;

  activated: boolean;
  activatedProgress: number;
  activatedOf: number;

  engine: Engine;
  
  constructor(private changeDetectorRef: ChangeDetectorRef, private nav: NavController, private dbms: Dbms, private params: NavParams, private engineFactory: EngineFactory, private modalController: ModalController, private configuration: Configuration) {
    this.nav = nav;
    this.dbms = dbms;
    
    this.budget = this.params.data.budget;
    this.engine = engineFactory.getEngine(this.budget);

    this.activated = false;

    this.logger.debug("Calling activate budget");
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
    // TODO get cache it in the category record and get it straight from there
    let t = this.budget.transactionProcessor.findTransactionsForRecord(category, InitCategorySimpleWeeklyTransaction)[0];
    if (t) return t.weeklyAmount;
  }


  ionViewDidLeave() {
    // TODO: CHeck this is called appropriately (ie. on a different setRoot(), but not on navigating to a child page)
   // this.budget.deactivate();
  }

  ionViewDidEnter() {
    this.configuration.lastOpenedBudget(this.budget.id);

    this.budget.activate(this.activateProgressCallback.bind(this)).then(() => {    
      this.logger.debug("Activate Budget Resolved");

      this.budgetRecord = this.budget.transactionProcessor.single(Budget);

      this.activated = true;
    });

  } 

  activateProgressCallback(value: number, of: number) {
    this.activatedProgress = value;
    this.activatedOf = of;
  }


}