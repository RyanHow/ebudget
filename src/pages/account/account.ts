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
import {BankPage} from '../bank/bank';

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

  gotoBank() {
    this.nav.push(BankPage, {budgetId: this.navParams.data.budgetId,  accountId: this.navParams.data.accountId});
  }

}
