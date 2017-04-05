import {NavController, ViewController, NavParams, AlertController, App} from 'ionic-angular';
import {Db} from '../../db/db';
import {Account} from '../../data/records/account';
import {Dbms} from '../../db/dbms';
import {EngineFactory} from '../../engine/engine-factory';
import {Engine} from '../../engine/engine';
import {CreateAccountTransaction} from '../../data/transactions/create-account-transaction';
import {Component} from '@angular/core';

@Component({
  templateUrl: 'add-edit-account.html'
})
export class AddEditAccountModal {
  db: Db;
  engine: Engine;
  editing: boolean;
  data: {name: string};
  transaction: CreateAccountTransaction;
  
  constructor(public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController, private engineFactory: EngineFactory, private appController: App) {    
    this.db = dbms.getDb(navParams.data.budgetId);
    this.engine = engineFactory.getEngineById(this.db.id);
    this.data = <any>{};

    if (navParams.data.accountId) {
      this.editing = true;
      let account = this.engine.getRecordById(Account, navParams.data.accountId);
      this.data.name = account.name;
      this.transaction = this.db.transactionProcessor.findTransactionsForRecord(account, CreateAccountTransaction)[0];
    } else {
      this.editing = false;
      this.transaction = new CreateAccountTransaction();
    }
    
  }
  
  submit(event: Event) {
    event.preventDefault();

    this.transaction.name = this.data.name;
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