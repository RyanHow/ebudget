import {NavController, ViewController, NavParams, AlertController, App} from 'ionic-angular';
import {Db} from '../../db/db';
import {Account} from '../../data/records/account';
import {Dbms} from '../../db/dbms';
import {EngineFactory} from '../../engine/engine-factory';
import {BankProviderManager} from '../../bank/bank-provider-manager';
import {Engine} from '../../engine/engine';
import {CreateAccountTransaction} from '../../data/transactions/create-account-transaction';
import {Component} from '@angular/core';
import Big from 'big.js';

@Component({
  templateUrl: 'add-edit-account.html'
})
export class AddEditAccountModal {
  db: Db;
  engine: Engine;
  editing: boolean;
  data: {name: string; openingBalance: string; accountType: 'Cash' | 'Bank'; accountNumber: string; bankProviderName: string; openingBankBalance: string};
  transaction: CreateAccountTransaction;
  
  constructor(public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController, private engineFactory: EngineFactory, private appController: App, private bankProviderManager: BankProviderManager) {    
    this.db = dbms.getDb(navParams.data.budgetId);
    this.engine = engineFactory.getEngineById(this.db.id);
    this.data = <any>{};

    if (navParams.data.accountId) {
      this.editing = true;
      let account = this.engine.getRecordById(Account, navParams.data.accountId);
      this.data.name = account.name;
      this.data.openingBalance = account.openingBalance == null ? "0" : account.openingBalance.toString();
      this.data.accountType = account.accountType;
      this.transaction = this.db.transactionProcessor.findTransactionsForRecord(account, CreateAccountTransaction)[0];
      this.data.accountNumber = account.x.accountNumber;
      this.data.bankProviderName = account.x.bankProviderName;
      this.data.openingBankBalance = account.x.openingBankBalance == null ? "0" : account.x.openingBankBalance;
    } else {
      this.editing = false;
      this.transaction = new CreateAccountTransaction();
      this.data.openingBalance = "0";
      this.data.accountType = 'Bank';
    }
    
  }
  
  submit(event: Event) {
    event.preventDefault();

    this.transaction.name = this.data.name;
    this.transaction.openingBalance = new Big(this.data.openingBalance);
    this.transaction.accountType = this.data.accountType;
    this.transaction.bankDetails = <any> {};
    this.transaction.bankDetails.accountNumber = this.data.accountNumber;
    this.transaction.bankDetails.bankProviderName = this.data.bankProviderName;
    this.transaction.bankDetails.openingBankBalance = new Big(this.data.openingBankBalance);


    this.db.applyTransaction(this.transaction);
    let accountRecord = this.db.transactionProcessor.findRecordsForTransaction(this.transaction, Account)[0];

    this.viewCtrl.dismiss({accountId: accountRecord.id});
  }
  
  cancel() {
    this.viewCtrl.dismiss();    
  }
  
  deleteAccountConfirm() {
    // TODO: Prolly better to archive it than delete it if anything linked to it
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this account and everything in it?',
      buttons: [
        {
          text: 'Cancel'
        } , {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirm.dismiss().then(() => {
              this.deleteAccount();
            });
          }
        }
      ]
    });

    confirm.present();
  }
  
  deleteAccount() {
    this.db.deleteTransaction(this.transaction);
    
    this.appController.getRootNav().pop({animate: false, duration: 0});
    this.viewCtrl.dismiss();

  }
} 