import {NavController, ViewController, NavParams, AlertController, ModalController} from 'ionic-angular';
import {Category} from '../../data/records/category';
import {Transaction} from '../../data/records/transaction';
import {EngineFactory} from '../../engine/engine-factory';
import {Engine} from '../../engine/engine';
import {CreateSplitTransaction} from '../../data/transactions/create-split-transaction';
import {Configuration} from '../../services/configuration-service';
import {Component} from '@angular/core';
import {Utils} from '../../services/utils';
import Big from 'big.js';
import {AddEditSplitTransactionLineModal} from './add-edit-split-transaction-line';

@Component({
  templateUrl: 'add-edit-split-transaction.html'
})
export class AddEditSplitTransactionModal {

  data: {
    expense: boolean;
    date: string;
    description: string;
    amount: string;
    accountId: number;

    lines: Array<{
      categoryId: number;
      accountId?: number;
      amount: string;
    }>
  };

  engine: Engine;
  editing: boolean;
  category: Category;
  transaction: CreateSplitTransaction;
  
  constructor(private configuration: Configuration, private modalController: ModalController, public viewCtrl: ViewController, private navParams: NavParams, private engineFactory: EngineFactory, private nav: NavController, private alertController: AlertController) {
    this.engine = engineFactory.getEngineById(navParams.data.budgetId);
    this.engine.getCategory(navParams.data.categoryId);
    this.category = this.engine.db.transactionProcessor.table(Category).by('id', navParams.data.categoryId);

    // TODO: Validation that amounts must be equal
    this.data = <any> {};
    this.data.lines = [];


    if (navParams.data.transactionId) {
      this.editing = true;
      let transactionRecord = this.engine.db.transactionProcessor.table(Transaction).by('id', navParams.data.transactionId);
      this.transaction = this.engine.db.transactionProcessor.findTransactionsForRecord(transactionRecord, CreateSplitTransaction)[0];

      this.data.date = Utils.toIonicFromYYYYMMDD(this.transaction.date);
      this.data.expense = this.transaction.amounts[0].amount.cmp(Big(0)) >= 0;
      this.data.amount = this.totalAmount().toString();
      this.data.description = this.transaction.description;
      this.transaction.amounts.forEach(l => {
        this.data.lines.push({categoryId: l.categoryId, amount: l.amount.times(this.data.expense ? 1 : -1)+"", accountId: l.accountId});
      });
    } else {
      this.editing = false;
      this.data.expense = true;
      this.data.date = Utils.nowIonic();
      this.data.lines.push({
        categoryId: this.category.id,
        amount: ''
      });

    }
    
  }

  editLine(line: {categoryId: number; amount: string}) {
    let modal = this.modalController.create(AddEditSplitTransactionLineModal, {
      parent: this,
      lineIndex: this.data.lines.indexOf(line)
    }, {showBackdrop: false, enableBackdropDismiss: false});
    
    modal.present();
  }

  totalAmount(): BigJsLibrary.BigJS  {
    return this.data.lines.map(line => line.amount).reduce(
      (total, amount) => new Big((amount || '0').replace(',', '')).plus(total),
      new Big('0')
    ).abs();
  }

  amountRemaining(): BigJsLibrary.BigJS {
    return new Big((this.data.amount || '0').replace(',', '')).minus(this.totalAmount());
  }

  newLine() {
    this.data.lines.push({
      categoryId: null,
      amount: ''
    });
    this.editLine(this.data.lines[this.data.lines.length-1]);
  }
    
  submit(event: Event) {
    event.preventDefault();

    var t: CreateSplitTransaction;
    if (! this.editing) {
      t = new CreateSplitTransaction();
    } else {
      t = this.transaction;
    }    
    
    t.date = Utils.toYYYYMMDDFromIonic(this.data.date);
    t.description = this.data.description;

    // Always clear out the records in the transaction and not "merge" them
    // Our indexes should be preserved...
    t.amounts = [];
    this.data.lines.forEach((line) => {
      t.amounts.push({
        categoryId: line.categoryId,
        amount: new Big((line.amount || '0').replace(',', '')).times(this.data.expense ? 1 : -1),
        accountId: Number(line.accountId)
      });
    });


    this.engine.db.applyTransaction(t);

    this.viewCtrl.dismiss();
  }
  
  cancel() {
    this.viewCtrl.dismiss();    
  }
  
  deleteTransactionConfirm() {
    let confirm = this.alertController.create({
      title: 'Delete?',
      message: 'Are you sure you want to delete this entire transaction?',
      buttons: [
        {
          text: 'Cancel'
        } , {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            confirm.dismiss().then(() => {
              this.deleteTransaction();
            });
            return false;
          }
        }
      ]
    });

    confirm.present();
  }
  
  deleteTransaction() {
    this.engine.db.deleteTransaction(this.transaction);
    
    this.viewCtrl.dismiss();
  }
  
  toggleExpense() {
    this.data.expense = !this.data.expense;
  }
} 