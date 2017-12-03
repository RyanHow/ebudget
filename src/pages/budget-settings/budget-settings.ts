import {NavController, NavParams, AlertController, ModalController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Db} from '../../db/db';
import {Engine} from '../../engine/engine';
import {EngineFactory} from '../../engine/engine-factory';
import {Dbms} from '../../db/dbms';
import {Configuration} from '../../services/configuration-service';
import {Replication} from '../../services/replication-service';
import {Logger} from '../../services/logger';
import {Budget} from '../../data/records/budget';
import {HomePage} from '../home/home';
import {ShareBudgetModal} from '../../modals/share-budget/share-budget';
import {InitBudgetTransaction} from '../../data/transactions/init-budget-transaction';
import {Http} from '@angular/http';
import {Account} from '../../data/records/account';
import {AccountPage} from '../../pages/account/account';
import {AddEditAccountModal} from '../../modals/add-edit-account/add-edit-account';
import { BankLink } from "../../data/records/bank-link";
import { AddEditBankLinkModal } from "../../modals/add-edit-bank-link/add-edit-bank-link";
import { BankLinkPage } from "../bank-link/bank-link";

@Component({
  templateUrl: 'budget-settings.html'
})
export class BudgetSettingsPage {
  
  private db: Db;
  private initBudgetTransaction: InitBudgetTransaction;
  private logger: Logger = Logger.get('BudgetSettingsPage');
  private engine: Engine;

  private data: {
    budgetName: string;
  }

  public budgetNameUpdating: boolean;

  constructor(private nav: NavController, private navParams: NavParams, private configuration: Configuration, private replication: Replication, private http: Http, private dbms: Dbms, private alertController: AlertController, private engineFactory: EngineFactory, private modalController: ModalController) {
    this.nav = nav;
    this.db = this.dbms.getDb(navParams.data.budgetId);
    this.engine = this.engineFactory.getEngine(this.db);

    let budgetRecord = this.db.transactionProcessor.single(Budget);
    this.initBudgetTransaction = this.db.transactionProcessor.findTransactionsForRecord(budgetRecord, InitBudgetTransaction)[0];

    this.data = <any>{};
    this.data.budgetName = this.db.name();
  }

  addAccount() {
    let modal = this.modalController.create(AddEditAccountModal, {budgetId: this.db.id});

    modal.onDidDismiss(data => {
      if (data && data.accountId) {
        this.nav.push(AccountPage, {accountId: data.accountId, budgetId: this.db.id});
      }
    });

    modal.present();
  }

  openAccount(account: Account) {
    this.nav.push(AccountPage, {accountId: account.id, budgetId: this.db.id});
  }

  addBankLink() {
    let modal = this.modalController.create(AddEditBankLinkModal, {budgetId: this.db.id});

    modal.onDidDismiss(data => {
      if (data && data.bankLinkId) {
        this.nav.push(BankLinkPage, {bankLinkId: data.bankLinktId, budgetId: this.db.id});
      }
    });

    modal.present();
  }

  openBankLink(bankLink: BankLink) {
    this.nav.push(BankLinkPage, {bankLinkId: bankLink.id, budgetId: this.db.id});
  }


  updateBudgetName() {
    if (this.data.budgetName == "") {
      this.data.budgetName = this.initBudgetTransaction.budgetName;
      return;
    }

    if (this.initBudgetTransaction.budgetName !== this.data.budgetName) {
      this.initBudgetTransaction.budgetName = this.data.budgetName;
      this.db.applyTransaction(this.initBudgetTransaction);
      
      if (this.replication.enabled(this.db)) {
        // TODO: really need to refactor this out...
        this.budgetNameUpdating = true;
        ShareBudgetModal.postShare(this.http, this.db.id, this.db.name(), this.configuration.deviceInstallationId, this.configuration.deviceName)
        .map(response => response.json())
        .subscribe(response => {
          this.logger.info("Updated shared budget name to " + this.db.name());
        }, error => {
          this.logger.error("Error updating shared budget name to " + this.db.name(), error);
        }, () => {
          this.budgetNameUpdating = false;
        });
      }
    }
  }

  deleteBudgetConfirm() {
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this budget (' + this.db.name() + ')?',
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
    this.db.deactivate();
    this.dbms.deleteDb(this.db.id);
    this.configuration.lastOpenedBudget(null);
    this.nav.setRoot(HomePage);
  }

    
}
