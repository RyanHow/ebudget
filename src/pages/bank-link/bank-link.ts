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
import { BankLink } from "../../data/records/bank-link";
import { AddEditBankLinkModal } from "../../modals/add-edit-bank-link/add-edit-bank-link";

@Component({
  templateUrl: 'bank-link.html'
})
export class BankLinkPage {
  
  engine: Engine;
  bankLink: BankLink;
  syncing: boolean;
  private logger = Logger.get('BankLinkPage');

  constructor(private nav: NavController, private dbms: Dbms, private navParams: NavParams, private engineFactory: EngineFactory, private modalController: ModalController, private bankSync: BankSync, private notifications: Notifications, private standardHostInterface: StandardHostInterface) {
    this.engine = this.engineFactory.getEngineById(navParams.data.budgetId);
    this.bankLink = this.engine.getRecordById(BankLink, navParams.data.bankLinkId);
  }
  
  editBankLink() {
    let modal = this.modalController.create(AddEditBankLinkModal, {budgetId: this.engine.db.id, bankLinkId: this.bankLink.id});
    modal.present();
  }

  gotoBank() {
    this.nav.push(BankPage, {budgetId: this.navParams.data.budgetId,  bankLinkId: this.navParams.data.bankLinkId});
  }

}
