import {NavController, NavParams, ModalController} from 'ionic-angular';
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


@Component({
  templateUrl: 'bank.html'
})
export class BankPage {
  
  engine: Engine;
  account: Account;
  syncing: boolean;
  bankTransactionTable: LokiCollection<BankTransaction>;
  transactionView: LokiDynamicView<BankTransaction>;

  private logger = Logger.get('BankPage');

  constructor(private nav: NavController, private dbms: Dbms, private navParams: NavParams, private engineFactory: EngineFactory, private modalController: ModalController, private bankSync: BankSync, private notifications: Notifications, private standardHostInterface: StandardHostInterface) {
    this.engine = this.engineFactory.getEngineById(navParams.data.budgetId);
    this.account = this.engine.getRecordById(Account, navParams.data.accountId);
    this.bankTransactionTable = this.engine.db.transactionProcessor.table(BankTransaction);
    this.transactionView = <any> {data: function() {return []; }};
  }
  

  async syncBank() {
    this.syncing = true;

    // TODO: Does try/catch work on async/await ?

    try {
      //await this.bankSync.sync(this.account.x.bankProviderName, this.account, this.engine);
      this.notifications.notify("Syncing Done");
    } catch (error) {
      this.logger.info("Bank Sync Error", error);
      this.notifications.notify("Error syncing: " + error);
    } finally {
      this.syncing = false;
    }
  }

  showSyncWindow() {
    //this.standardHostInterface.manualShowBrowser();
  }



  ionViewWillEnter() {
    this.transactionView = this.bankTransactionTable.addDynamicView('accountBankTransactions_' + this.account.id)
    .applyFind({'accountId': this.account.id})
    .applySortCriteria([['date', true], ['id', false]]);

    this.logger.debug('WIll Enter Dynamic Views ' + this.bankTransactionTable.DynamicViews.length);

    /*if (this.transactions.data().length <= this.transactionDisplayLimit) {
      this.transactionDisplayLimit = 0;
      this.infiniteScroll.enable(false);
    }*/


  }
  ionViewDidLeave() {
    this.bankTransactionTable.removeDynamicView(this.transactionView.name);
    this.logger.debug('Did Leave Dynamic Views ' + this.bankTransactionTable.DynamicViews.length);
    this.transactionView = <any> {data: function() {return []; }};

  }

  openTransaction(t: BankTransaction) {
    let modal = this.modalController.create(ViewBankTransactionModal, {budgetId: this.navParams.data.budgetId, bankTransactionId: t.id});
    modal.present();
  }


}
