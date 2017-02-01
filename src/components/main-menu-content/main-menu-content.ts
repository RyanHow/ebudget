import {ModalController, Menu, Nav, App, AlertController} from 'ionic-angular';
import {Component, Input} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Db} from '../../db/db';
import {Configuration} from '../../services/configuration-service';
import {Replication} from '../../services/replication-service';
import {BudgetPage} from '../../pages/budget/budget';
import {HomePage} from '../../pages/home/home';
import {InitBudgetTransaction} from '../../data/transactions/init-budget-transaction';
import {AddBudgetModal} from '../../modals/add-budget/add-budget';
import {DevPage} from '../../pages/dev/dev';
import {SettingsPage} from '../../pages/settings/settings';

// -- //
import {ShareBudgetModal} from '../../modals/share-budget/share-budget';
// -- //

@Component({
  selector: 'main-menu-content',
  templateUrl: 'main-menu-content.html'
})

export class MainMenuContent {
  
  @Input()
  menu: Menu;
  @Input()
  nav: Nav;
  budgets: Db[];

  private syncing: boolean;

  constructor(private dbms: Dbms, private app: App, private configuration: Configuration, private replication: Replication, private modalController: ModalController, private alertController: AlertController) {
    this.dbms = dbms;
    this.budgets = dbms.dbs;
    this.app = app;
  }

  isBudgetPageOpen(): boolean {
    return false;
  }
  
  budgetName(budget: Db): string {
    return budget.name() || 'New Budget (' + budget.id + ')';
  }
  
  openBudget(budget: Db) {
    this.nav.setRoot(BudgetPage, {'budget': budget});
  }

  lastOpenedBudget(): Db {
    let budgetId = this.configuration.lastOpenedBudget();
    if (!budgetId) return;
    let budget = this.dbms.getDb(budgetId);
    return budget;
  }
  
  goHome() {
    this.nav.setRoot(HomePage);
  }
  
  goDev() {
    this.nav.setRoot(DevPage);
  }

  goSettings() {
    this.nav.setRoot(SettingsPage);
  }

  addBudget() {
    let modal = this.modalController.create(AddBudgetModal);

    modal.onDidDismiss((data) => {
      if (data && data.budgetName !== '') {
        this.dbms.createDb().then(db => {
          db.activate();
          let t = new InitBudgetTransaction();
          t.budgetName = data.budgetName;
          db.applyTransaction(t);
          db.deactivate();

          this.nav.setRoot(BudgetPage, {'budget': db});
        });
      }
    });

    modal.present();

  }

  // -- //
  
  shareBudget() {
    let modal = this.modalController.create(ShareBudgetModal);
    modal.data.budgetId = this.lastOpenedBudget().id;
    modal.present();

  }

  get shared(): boolean {
    return this.replication.enabled(this.lastOpenedBudget());
  }

  linkBudget() {
    let modal = this.modalController.create(ShareBudgetModal);
    modal.onDidDismiss((data) => {
      if (data && data.newBudget) {
        this.nav.setRoot(BudgetPage, {'budget': data.newBudget});
      }
    });
    modal.present();
  }

  sync(event) {
    this.syncing = true;
    setTimeout(() =>
      this.replication.sync().then(() => { this.syncing = false; }, () => { this.syncing = false; }),
      1000
    );
  }

  // -- //


  renameBudget() {
    let modal = this.modalController.create(AddBudgetModal);
    modal.data.budgetName = this.lastOpenedBudget().name();

    modal.onDidDismiss((data) => {
      if (data && data.budgetName !== '' && data.budgetName !== this.lastOpenedBudget().name()) {
        let t = InitBudgetTransaction.getFrom(this.lastOpenedBudget());
        t.budgetName = data.budgetName;
        this.lastOpenedBudget().applyTransaction(t);
      }
    });

    modal.present();

  }

  deleteBudget() {
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this budget (' + this.lastOpenedBudget().name() + ')?',
      buttons: [
        {
          text: 'Cancel'
        } , {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirm.dismiss().then(() => {
              this.doDeleteBudget();
            });
            return false;
          }
        }
      ]
    });

    confirm.present();
  }

  doDeleteBudget() {
    this.lastOpenedBudget().deactivate();
    this.dbms.deleteDb(this.lastOpenedBudget().id);
    this.configuration.lastOpenedBudget(null);
    this.nav.setRoot(HomePage);
  }

}