import {NavController, NavParams, ModalController, Slides} from 'ionic-angular';
import {Component, ViewChild} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Engine} from '../../engine/engine';
import {EngineFactory} from '../../engine/engine-factory';
import {Account} from '../../data/records/account';
import {AddEditAccountModal} from '../../modals/add-edit-account/add-edit-account';
import {BankSync} from '../../bank/bank-sync';
import {Notifications} from '../../services/notifications';
import {Logger} from '../../services/logger';
import {StandardHostInterface} from '../../bank/standard-host-interface';
import {BankAccountPage} from '../bank-account/bank-account';
import { AccountTransaction } from "../../data/records/account-transaction";
import { BankTransaction } from "../../data/records/bank-transaction";

@Component({
  templateUrl: 'account.html'
})
export class AccountPage {
  
  engine: Engine;
  account: Account;
  syncing: boolean;
  private logger = Logger.get('AccountPage');

  accountTransactionTable: LokiCollection<AccountTransaction>;
  accountTransactions: LokiDynamicView<AccountTransaction>;

  bankTransactionTable: LokiCollection<BankTransaction>;
  bankTransactions: LokiDynamicView<BankTransaction>;
  toReconcile: LokiDynamicView<BankTransaction>;

  @ViewChild(Slides) slides: Slides;
  currentSlide: number = 0;
  
  constructor(private nav: NavController, private dbms: Dbms, private navParams: NavParams, private engineFactory: EngineFactory, private modalController: ModalController, private bankSync: BankSync, private notifications: Notifications, private standardHostInterface: StandardHostInterface) {
    this.engine = this.engineFactory.getEngineById(navParams.data.budgetId);
    this.account = this.engine.getRecordById(Account, navParams.data.accountId);
    this.accountTransactionTable = this.engine.db.transactionProcessor.table(AccountTransaction);
    this.accountTransactions = <any> {data: function() {return []; }};
    this.bankTransactionTable = this.engine.db.transactionProcessor.table(BankTransaction);
    this.toReconcile = <any> {data: function() {return []; }};
    this.bankTransactions = <any> {data: function() {return []; }};

  }
  
  editAccount() {
    let modal = this.modalController.create(AddEditAccountModal, {budgetId: this.engine.db.id, accountId: this.account.id});
    modal.present();
  }

  gotoBank() {
    this.nav.push(BankAccountPage, {budgetId: this.navParams.data.budgetId,  accountId: this.navParams.data.accountId});
  }

  ionViewWillEnter() {
    this.accountTransactions = this.accountTransactionTable.addDynamicView('accountTransactions_' + this.account.id, {persistent : true, sortPriority: 'active'})
    .applyFind({'accountId': this.account.id})
    .applySortCriteria([['date', true], ['id', true]]);


    this.toReconcile = this.bankTransactionTable.addDynamicView('bankTransactionsToReconcile_' + this.account.id, {persistent : true, sortPriority: 'active'})
    .applyFind({'accountId': this.account.id})
    .applyWhere(t => !t.x.reconciled && !t.x.ignored)
    .applySortCriteria([['date', true], ['id', true]]);

    this.bankTransactions = this.bankTransactionTable.addDynamicView('bankTransactionsAll_' + this.account.id, {persistent : true, sortPriority: 'active'})
    .applyFind({'accountId': this.account.id})
    .applySortCriteria([['date', true], ['id', true]]);

    // TODO: Infinite scroll (or virtualscroll would be better once it can have a static header)
    //if (this.accountTransactions.data().length <= this.transactionDisplayLimit) {
    //  this.transactionDisplayLimit = 0;
    //  this.infiniteScroll.enable(false);
    //}


  }
  ionViewDidLeave() {
    this.accountTransactionTable.removeDynamicView(this.accountTransactions.name);
    this.accountTransactions = <any> {data: function() {return []; }};

    this.bankTransactionTable.removeDynamicView(this.toReconcile.name);
    this.bankTransactionTable.removeDynamicView(this.bankTransactions.name);

    this.bankTransactions = <any> {data: function() {return []; }};
    this.toReconcile = <any> {data: function() {return []; }};

  }

  slideChanged() {
    this.currentSlide = this.slides.getActiveIndex();
    if (this.currentSlide > 2) this.currentSlide = 2;
  }

  changeSlide() {
    setTimeout(() => {
      this.slides.slideTo(this.currentSlide, undefined, false);
    });

  }

}
