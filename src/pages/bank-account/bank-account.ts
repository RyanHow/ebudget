import {NavController, NavParams, ModalController, AlertController, ItemSliding} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Engine} from '../../engine/engine';
import {EngineFactory} from '../../engine/engine-factory';
import {Account} from '../../data/records/account';
import {BankSync} from '../../bank/bank-sync';
import {Notifications} from '../../services/notifications';
import {Logger} from '../../services/logger';
import {StandardHostInterface} from '../../bank/standard-host-interface';
import { BankTransaction } from '../../data/records/bank-transaction';
import { ViewBankTransactionModal } from "../../modals/view-bank-transaction/view-bank-transaction";
import { BankLinkPage } from "../bank-link/bank-link";
import { Configuration } from "../../services/configuration-service";
import { BankTransactionIgnore } from "../../data/transactions/bank-transaction-ignore";
import { BankTransactionDelete } from "../../data/transactions/bank-transaction-delete";


@Component({
  templateUrl: 'bank-account.html'
})
export class BankAccountPage {
  
  engine: Engine;
  account: Account;
  syncing: boolean;
  bankTransactionTable: LokiCollection<BankTransaction>;
  transactionView: LokiDynamicView<BankTransaction>;
  transactionViewData: BankTransaction[] = [];
  transactionViewDummyData = [];
  transactionViewArrayData: BankTransaction[] = [];
  transactionViewArrayDataBlank: BankTransaction = new BankTransaction();
  multiSelectEnabled: boolean;
  selected: {};
  
  private logger = Logger.get('BankPage');

  constructor(private nav: NavController, private dbms: Dbms, private navParams: NavParams, private engineFactory: EngineFactory, private modalController: ModalController, private bankSync: BankSync, private notifications: Notifications, private standardHostInterface: StandardHostInterface, private configuration: Configuration, private alertController: AlertController) {
    this.engine = this.engineFactory.getEngineById(navParams.data.budgetId);
    this.account = this.engine.getRecordById(Account, navParams.data.accountId);
    this.bankTransactionTable = this.engine.db.transactionProcessor.table(BankTransaction);
    this.transactionView = <any> {data: function() {return this.transactionViewDummyData; }};
    this.multiSelectEnabled = false;
    this.selected = {};
    // TODO: If ! touch enabled then start in multiselect mode?
  }
  
  goBankLink() {
    this.nav.push(BankLinkPage, {budgetId: this.engine.db.id, bankLinkId: this.account.bankLinkId});
  }

  isSyncing(): boolean {
    return false;
  }

  refreshData() {
    this.transactionViewData = this.transactionView.data();
    this.transactionViewDummyData.push(new BankTransaction());
  }

  ionViewWillEnter() {
    this.transactionView = this.bankTransactionTable.addDynamicView('accountBankTransactions_' + this.account.id)
    .applyFind({'accountId': this.account.id})
    .applySortCriteria([['date', true], ['id', false]]);
    this.transactionViewData = this.transactionView.data();

    this.logger.debug('WIll Enter Dynamic Views ' + this.bankTransactionTable.DynamicViews.length);

    /*if (this.transactions.data().length <= this.transactionDisplayLimit) {
      this.transactionDisplayLimit = 0;
      this.infiniteScroll.enable(false);
    }*/


  }
  ionViewDidLeave() {
    this.bankTransactionTable.removeDynamicView(this.transactionView.name);
    this.logger.debug('Did Leave Dynamic Views ' + this.bankTransactionTable.DynamicViews.length);
    this.transactionView = <any> {data: function() {return this.transactionViewDummyData; }};
    this.transactionViewData = [];
  }

  transactionViewArray(): BankTransaction[] {
    this.transactionViewArrayData.length = 0;
    this.transactionViewArrayData.push(... this.transactionViewDummyData);
    this.transactionViewArrayData.push(... this.transactionView.data());
    return this.transactionViewArrayData;
  }

  unreconciledTransactions(): BankTransaction[] {
    return this.transactionView.data().filter(t => !t.x.reconciled)
  }

  openTransaction(t: BankTransaction) {
    let modal = this.modalController.create(ViewBankTransactionModal, {budgetId: this.navParams.data.budgetId, bankTransactionId: t.id});
    modal.present();
  }

  transactionListDateHeader(record, recordIndex, records) {
    if (recordIndex === 0 || record.date !== records[recordIndex-1].date) return record;
    return null;
  }

  toggleMultiSelect() {
    this.multiSelectEnabled = !this.multiSelectEnabled;
  }

  selectAll() {
    this.unselectAll();
    this.unreconciledTransactions().forEach(t => this.selected[t.id] = true);
  }

  unselectAll() {
    Object.keys(this.selected).forEach(key => this.selected[key] = false);
  }

  allSelected() {
    return this.unreconciledTransactions().every(t => this.selected[t.id] === true);
  }

  anySelected() {
    return this.unreconciledTransactions().some(t => this.selected[t.id] === true);    
  }

  ignoreItem(t: BankTransaction, itemSliding?: ItemSliding) {
    let bti = new BankTransactionIgnore();
    bti.bankTransactionId = t.id;
    this.engine.db.applyTransaction(bti);
    if (itemSliding)  itemSliding.close();
  }

  unignoreItem(t: BankTransaction, itemSliding?: ItemSliding) {
    this.engine.db.transactionProcessor.findTransactionsForRecord(t, BankTransactionIgnore).forEach(bti => {
      this.engine.db.deleteTransaction(bti);
    });
    if (itemSliding) itemSliding.close();
  }

  deleteItem(t: BankTransaction) {
    this.alertController.create({
      message: 'Deleting this bank transaction is irreversable. You only want to do this in the event of an error, otherwise "ignore" the transaction.',
      buttons: [
        'Cancel',
        {
          text: 'Delete',
          cssClass: 'danger',
          handler: () => this.doDeleteItem(t)
        }
      ]
    }).present();
  }

  doDeleteItem(t: BankTransaction) {
    let btd = new BankTransactionDelete();
    btd.bankTransactionId = t.id;
    this.engine.db.applyTransaction(btd);
  }

  deleteSelected() {
    this.alertController.create({
      message: 'Deleting bank transactions is irreversable. You only want to do this in the event of an error, otherwise "ignore" the transaction.',
      buttons: [
        'Cancel',
        {
          text: 'Delete',
          cssClass: 'danger',
          handler: () =>  this.unreconciledTransactions().filter(t => this.selected[t.id] === true && !t.x.reconciled).forEach(t => this.doDeleteItem(t))
        }
      ]
    }).present();
  }

  ignoreSelected() {
    this.unreconciledTransactions()
      .filter(t => this.selected[t.id] === true && !t.x.reconciled && !t.x.ignored)
      .forEach(t => this.ignoreItem(t));
  }

  unignoreSelected() {
    this.unreconciledTransactions()
      .filter(t => this.selected[t.id] === true && !t.x.reconciled && t.x.ignored)
      .forEach(t => this.unignoreItem(t));
  }


}
