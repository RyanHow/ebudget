import {ModalController, Menu, Nav, App, AlertController, ToastController} from 'ionic-angular';
import {Component, Input, ApplicationRef} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Db} from '../../db/db';
import {BudgetSettingsPage} from '../../pages/budget-settings/budget-settings';
import {Configuration} from '../../services/configuration-service';
import {Replication} from '../../services/replication-service';
import {Notifications} from '../../services/notifications';
import {BudgetPage} from '../../pages/budget/budget';
import {HomePage} from '../../pages/home/home';
import {InitBudgetTransaction} from '../../data/transactions/init-budget-transaction';
import {AddBudgetModal} from '../../modals/add-budget/add-budget';
import {DevPage} from '../../pages/dev/dev';
import {SettingsPage} from '../../pages/settings/settings';
import {AboutPage} from '../../pages/about/about';
import {NotificationsPage} from '../../pages/notifications/notifications';
import {ShareBudgetModal} from '../../modals/share-budget/share-budget';
import { BankSync } from "../../bank/bank-sync";
import { BankSyncMonitor } from "../../bank/bank-sync-monitor";
import { EngineFactory } from "../../engine/engine-factory";
import { Engine } from "../../engine/engine";
import { BankSyncUtils } from "../../bank/bank-sync-utils";
import { AccountsPage } from "../../pages/accounts/accounts";

@Component({
  selector: 'main-menu-content',
  templateUrl: 'main-menu-content.html'
})

export class MainMenuContent {
  
  @Input()
  menu: Menu;
  @Input()
  public nav: Nav;
  
  budgets: Db[];
  window: Window = window;
  markReadTimeout: number;

  private syncing: boolean;

  constructor(private dbms: Dbms, private app: App, private configuration: Configuration, private replication: Replication, private modalController: ModalController, private alertController: AlertController, private toastCtrl: ToastController, private notifications: Notifications, private applicationRef: ApplicationRef, private bankSync: BankSync, private engineFactory: EngineFactory) {
    this.dbms = dbms;
    this.budgets = dbms.dbs;
    this.app = app;
  }

  ngOnInit() {
    this.menu.ionOpen.subscribe(() => {
      this.markReadTimeout = setTimeout(() => {
        this.notifications.markRead(3);
        this.markReadTimeout = 0;
        this.applicationRef.tick();
      }, 3000);
    });

    this.menu.ionClose.subscribe(() => {
      if (this.markReadTimeout) clearTimeout(this.markReadTimeout);
    });
  }

  isBudgetPageOpen(): boolean {
    return this.nav.getActive().component === BudgetPage;
  }
  
  budgetName(budget: Db): string {
    return budget.name() || 'New Budget (' + budget.id + ')';
  }
  
  openBudget(budget: Db) {
    this.nav.setRoot(BudgetPage, {'budget': budget});
  }

  engine(): Engine {
    return this.engineFactory.getEngine(this.lastOpenedBudget());
  }

  lastOpenedBudget(): Db {
    // TODO: Cache the budget - or just have a "currentBudget" in the configuration or app or something....

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

  goBudgetSettings() {
    this.nav.setRoot(BudgetSettingsPage, {budgetId: this.lastOpenedBudget().id});
  }

  goAccounts() {
    this.nav.setRoot(AccountsPage, {budgetId: this.lastOpenedBudget().id});
  }

  goAbout() {
    this.nav.setRoot(AboutPage);
  }

  addBudget() {
    let modal = this.modalController.create(AddBudgetModal);

    // TODO: Refactor with HomePage. Move to AddBudgetModal...
    modal.onDidDismiss((data) => {
      if (data && data.budgetName !== '') {
        this.dbms.createDb().then(db => {
          db.activate().then(() => {
            let t = new InitBudgetTransaction();
            t.budgetName = data.budgetName;
            db.applyTransaction(t);
            db.deactivate();

            this.nav.setRoot(BudgetPage, {'budget': db});
            });
        });
      }
    });
  
    modal.present();

  }

  // -- //
  
  shareBudget() {
    let modal = this.modalController.create(ShareBudgetModal, {budgetId: this.lastOpenedBudget().id});
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
      this.replication.sync().then(
        () => { this.syncing = false; this.toastCtrl.create({message: 'Budget is up to date',duration: 3000}).present(); },
        () => { this.syncing = false;}
      ),
    1000);
  }

  // -- //

  clearNotifications() {
    this.notifications.clear(3);
  }

  goNotifications() {
    this.nav.setRoot(NotificationsPage);
  }

  isCurrentValidAutomaticBankLinks() {
    // TODO
    // And need a "cheap" way to get this value - perhaps update it off transactions. Basically we want a few criteria - a bank link is set up, it is linked to an account and all credentials are in there so it is automatic...
    // Note: Maybe not the automatic thing, coz we will have a prompting mechanism...
    // Really we can just getAccounts() and find bankLinkId != null
    // But also if it is valid for this particular "device" (and the user of the device)

    return true;

  }

  runBankLinks() {

    // TODO: Combine the notifications / status for these to running and complete and complete / with errors


    this.engine().getBankLinks().forEach(bl => {
      let monitor = BankSyncUtils.createMonitorWithNotifications(this.notifications);
      this.bankSync.sync(bl, this.engine(), undefined, monitor, true);
    });
  }

  accountUnreconciledCount(): number {
    return this.engine().getAccounts().reduce((total, account) => total += account.x.unreconciledCount, 0)
  }
  bankUnreconciledCount(): number {
    return this.engine().getAccounts().reduce((total, account) => total += account.x.bankUnreconciledCount, 0)
  }

}