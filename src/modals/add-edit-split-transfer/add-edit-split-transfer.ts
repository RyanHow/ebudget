import {NavController, ViewController, NavParams, AlertController, ModalController} from 'ionic-angular';
import {Category} from '../../data/records/category';
import {Transaction} from '../../data/records/transaction';
import {EngineFactory} from '../../engine/engine-factory';
import {Engine} from '../../engine/engine';
import {CreateSplitTransfer} from '../../data/transactions/create-split-transfer';
import {Configuration} from '../../services/configuration-service';
import {Component} from '@angular/core';
import {Utils} from '../../services/utils';
import { Big } from 'big.js';
import {AddEditSplitTransferLineModal} from './add-edit-split-transfer-line';

@Component({
  templateUrl: 'add-edit-split-transfer.html'
})
export class AddEditSplitTransferModal {

  data: {
    out: boolean;
    date: string;
    description: string;
    amount: string;
    categoryId: number;
    accountId: number;
    accountId2: number;
    lines: Array<{
      categoryId: number;
      amount: string;
    }>
  };

  engine: Engine;
  editing: boolean;
  category: Category;
  transaction: CreateSplitTransfer;
  categories: Category[];
  
  constructor(private configuration: Configuration, private modalController: ModalController, public viewCtrl: ViewController, private navParams: NavParams, private engineFactory: EngineFactory, private nav: NavController, private alertController: AlertController) {
    this.engine = engineFactory.getEngineById(navParams.data.budgetId);
    this.engine.getCategory(navParams.data.categoryId);
    this.category = this.engine.db.transactionProcessor.table(Category).by('id', navParams.data.categoryId);
    this.categories = this.engine.getCategories('alphabetical');

    // TODO: Validation that amounts must be equal
    this.data = <any> {};
    this.data.lines = [];


    if (navParams.data.transactionId) {
      this.editing = true;
      let transactionRecord = this.engine.db.transactionProcessor.table(Transaction).by('id', navParams.data.transactionId);
      this.transaction = this.engine.db.transactionProcessor.findTransactionsForRecord(transactionRecord, CreateSplitTransfer)[0];

      this.data.date = Utils.toIonicFromYYYYMMDD(this.transaction.date);
      this.data.out = this.transaction.amounts[0].amount.cmp(Big(0)) >= 0;
      this.data.accountId = this.transaction.accountId;
      this.data.accountId2 = this.transaction.accountId2;
      this.data.amount = this.totalAmount().toString();
      this.data.description = this.transaction.description;
      this.data.categoryId = this.transaction.categoryId;
      this.transaction.amounts.forEach(l => {
        this.data.lines.push({categoryId: l.categoryId, amount: l.amount.times(this.data.out ? 1 : -1)+""});
      });
    } else {
      this.editing = false;
      this.data.out = true;
      this.data.date = Utils.nowIonic();
      this.data.lines.push({
        categoryId: this.category.id,
        amount: ''
      });

    }
    
  }

  editLine(line: {categoryId: number; amount: string}) {
    let modal = this.modalController.create(AddEditSplitTransferLineModal, {
      parent: this,
      lineIndex: this.data.lines.indexOf(line)
    }, {showBackdrop: false, enableBackdropDismiss: false});
    
    modal.present();
  }

  totalAmount(): Big  {
    return this.data.lines.map(line => line.amount).reduce(
      (total, amount) => new Big((amount || '0').replace(',', '')).plus(total),
      new Big('0')
    ).abs();
  }

  amountRemaining(): Big {
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

    var t: CreateSplitTransfer;
    if (! this.editing) {
      t = new CreateSplitTransfer();
    } else {
      t = this.transaction;
    }    
    
    t.date = Utils.toYYYYMMDDFromIonic(this.data.date);
    t.description = this.data.description;
    t.accountId = Number(this.data.accountId);
    t.accountId2 = Number(this.data.accountId2);
    t.categoryId = Number(this.data.categoryId);

    // Always clear out the records in the transaction and not "merge" them
    // Our indexes should be preserved...
    t.amounts = [];
    this.data.lines.forEach((line) => {
      t.amounts.push({
        categoryId: line.categoryId,
        amount: new Big((line.amount || '0').replace(',', '')).times(this.data.out ? 1 : -1),
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
  
  toggleOut() {
    this.data.out = !this.data.out;
  }
} 