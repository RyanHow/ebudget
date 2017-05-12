import {NavController, ViewController, NavParams, AlertController} from 'ionic-angular';
import {Db} from '../../db/db';
import {Dbms} from '../../db/dbms';
import {Configuration} from '../../services/configuration-service';
import {Component} from '@angular/core';
import {BankTransaction} from "../../data/records/bank-transaction";

@Component({
  templateUrl: 'view-bank-transaction.html'
})
export class ViewBankTransactionModal {

  budget: Db;
  t: BankTransaction;
  
  constructor(private configuration: Configuration, public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController) {
    this.viewCtrl = viewCtrl;
    this.nav = nav;
    
    this.budget = dbms.getDb(navParams.data.budgetId);
    this.t = this.budget.transactionProcessor.table(BankTransaction).by('id', navParams.data.bankTransactionId);

  }
      
  close() {
    this.viewCtrl.dismiss();    
  }
  
  deleteBankTransactionConfirm() {
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this transaction? (TODO: functionality, notice: This will "flag" it as deleted)',
      buttons: [
        {
          text: 'Cancel'
        } , {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirm.dismiss().then(() => {

              this.viewCtrl.dismiss();
            });
            return false;
          }
        }
      ]
    });

    confirm.present();
  }
  
} 