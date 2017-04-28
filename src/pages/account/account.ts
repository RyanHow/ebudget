import {NavController, NavParams, ModalController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Engine} from '../../engine/engine';
import {EngineFactory} from '../../engine/engine-factory';
import {Account} from '../../data/records/account';
import {AddEditAccountModal} from '../../modals/add-edit-account/add-edit-account';
import {BankSync} from '../../bank/bank-sync';
import {Notifications} from '../../services/notifications';
import {Logger} from '../../services/logger';
import {StandardHostInterface} from '../../bank/standard-host-interface';

@Component({
  templateUrl: 'account.html'
})
export class AccountPage {
  
  engine: Engine;
  account: Account;
  syncing: boolean;
  private logger = Logger.get('AccountPage');

  constructor(private nav: NavController, private dbms: Dbms, private navParams: NavParams, private engineFactory: EngineFactory, private modalController: ModalController, private bankSync: BankSync, private notifications: Notifications, private standardHostInterface: StandardHostInterface) {
    this.engine = this.engineFactory.getEngineById(navParams.data.budgetId);
    this.account = this.engine.getRecordById(Account, navParams.data.accountId);
  }
  
  editAccount() {
    let modal = this.modalController.create(AddEditAccountModal, {budgetId: this.engine.db.id, accountId: this.account.id});
    modal.present();
  }

  async syncBank() {
    this.syncing = true;

    // TODO: Does try/catch work on async/await ?

    try {
      await this.bankSync.sync(this.account.x.bankProviderName, this.account.x.accountNumber);
      this.notifications.notify("Syncing Done");
    } catch (error) {
      this.logger.info("Bank Sync Error", error);
      this.notifications.notify("Error syncing: " + error);
    } finally {
      this.syncing = false;
    }
  }

  showSyncWindow() {
    this.standardHostInterface.manualShowBrowser();
  }


}
