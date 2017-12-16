import {NavController, ViewController, NavParams, AlertController, App} from 'ionic-angular';
import {Db} from '../../db/db';
import {Account} from '../../data/records/account';
import {Dbms} from '../../db/dbms';
import {EngineFactory} from '../../engine/engine-factory';
import {Engine} from '../../engine/engine';
import {CreateAccountTransaction} from '../../data/transactions/create-account-transaction';
import {Component} from '@angular/core';
import Big from 'big.js';
import { Configuration, SecureAccessor } from "../../services/configuration-service";
import { BankLink } from "../../data/records/bank-link";
import { CreateBankLink } from "../../data/transactions/create-bank-link";
import { Utils } from "../../services/utils";
import { SecurePrompt } from "../../services/secure-prompt";
import { ProviderSchema } from "../../bank/provider-interface";
import { BankProviderRegistry } from "../../bank/bank-provider-registry";
import { BankLinkLocal } from "../../bank/bank-link-local";

@Component({
  templateUrl: 'add-edit-bank-link.html'
})
export class AddEditBankLinkModal {
  emptyproviderSchema = new ProviderSchema();
  db: Db;
  engine: Engine;
  editing: boolean;
  data: {name: string; provider: string; configuration: {}; autosync: boolean};
  transaction: CreateBankLink;
  secureAccessor: SecureAccessor;
  
  constructor(public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController, private engineFactory: EngineFactory, private appController: App, private bankProviderRegistry: BankProviderRegistry, private configuration: Configuration, private securePrompt: SecurePrompt, private bankLinkLocal: BankLinkLocal) {    
    this.db = dbms.getDb(navParams.data.budgetId);
    this.engine = engineFactory.getEngineById(this.db.id);
    this.data = <any>{};

    if (navParams.data.bankLinkId) {
      this.editing = true;
      let bankLink = this.engine.getRecordById(BankLink, navParams.data.bankLinkId);
      this.data.name = bankLink.name;
      this.data.provider = bankLink.provider;
      this.data.configuration = bankLink.configuration;
      this.data.autosync = this.bankLinkLocal.getInfo(bankLink.uuid).autosync;
      this.transaction = this.db.transactionProcessor.findTransactionsForRecord(bankLink, CreateBankLink)[0];

    } else {
      this.editing = false;
      this.transaction = new CreateBankLink();
      this.transaction.uuid = Utils.randomChars(12);
      this.data.configuration = {};
    }

    if (configuration.secureAvailable()) {
      this.secureAccessor = configuration.secureAccessor("banklink_" + this.transaction.uuid);
    }
    
  }

  getProviderSchema(): ProviderSchema {
    return this.data.provider == null ? this.emptyproviderSchema : this.bankProviderRegistry.getProviderSchema(this.data.provider);
  }
  
  submit(event: Event) {
    event.preventDefault();

    this.transaction.name = this.data.name;
    this.transaction.provider = this.data.provider;
    this.transaction.configuration = this.data.configuration;

    this.db.applyTransaction(this.transaction);
    let bankLinkRecord = this.db.transactionProcessor.findRecordsForTransaction(this.transaction, BankLink)[0];

    this.bankLinkLocal.updateInfo(this.transaction.uuid, info => {
      info.autosync = this.data.autosync;
      info.errorCount = 0;
    });

    this.viewCtrl.dismiss({accountId: bankLinkRecord.id});
  }
  
  cancel() {
    if (!this.editing && this.secureAccessor) this.secureAccessor.removeScope();
    this.viewCtrl.dismiss();    
  }
  
  deleteBankLinkConfirm() {
    // TODO: Prolly better to archive it than delete it if anything linked to it
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this bank link?',
      buttons: [
        {
          text: 'Cancel'
        } , {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirm.dismiss().then(() => {
              this.deleteBankLink();
            });
          }
        }
      ]
    });

    confirm.present();
  }

  
  deleteBankLink() {
    this.db.deleteTransaction(this.transaction);
    
    this.appController.getRootNav().pop({animate: false, duration: 0});
    this.viewCtrl.dismiss();

  }

} 