import {NavController, NavParams, AlertController, ModalController, IonicPage} from 'ionic-angular';
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
import { AccountTransaction } from "../../data/records/account-transaction";

@Component({
  templateUrl: 'accounts.html'
})
export class AccountsPage {

  
  private db: Db;
  private initBudgetTransaction: InitBudgetTransaction;
  private logger: Logger = Logger.get('AccountsPage');
  private engine: Engine;

  accounts: Account[];

  constructor(private nav: NavController, private navParams: NavParams, private dbms: Dbms, private engineFactory: EngineFactory, private modalController: ModalController) {
    this.nav = nav;
    this.db = this.dbms.getDb(navParams.data.budgetId);
    this.engine = this.engineFactory.getEngine(this.db);

    let budgetRecord = this.db.transactionProcessor.single(Budget);
    this.initBudgetTransaction = this.db.transactionProcessor.findTransactionsForRecord(budgetRecord, InitBudgetTransaction)[0];

    // TODO: Could better replace this with a view
    this.loadAccounts();
  }

  addAccount() {
    let modal = this.modalController.create(AddEditAccountModal, {budgetId: this.db.id});

    modal.onDidDismiss(data => {
      if (data && data.accountId) {
        this.loadAccounts();
      }
    });

    modal.present();
  }

  loadAccounts() {
    this.accounts = this.engine.getAccounts();
  }

  goAccount(account: Account) {
    this.nav.push(AccountPage, {accountId: account.id, budgetId: this.db.id});
  }



    
}
