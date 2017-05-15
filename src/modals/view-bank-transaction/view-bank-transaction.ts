import {NavController, ViewController, NavParams, AlertController} from 'ionic-angular';
import {Db} from '../../db/db';
import {Dbms} from '../../db/dbms';
import {Configuration} from '../../services/configuration-service';
import {Component} from '@angular/core';
import { BankTransaction } from "../../data/records/bank-transaction";
import { Transaction } from "../../data/records/transaction";
import { TransactionReconciliation } from "../../data/records/transaction-reconciliation";
import { EngineFactory } from "../../engine/engine-factory";
import { Engine } from "../../engine/engine";
import Big from 'big.js';
import { CreateTransactionReconciliation } from "../../data/transactions/create-transaction-reconciliation";

@Component({
  templateUrl: 'view-bank-transaction.html'
})
export class ViewBankTransactionModal {

  engine: Engine;
  budget: Db;
  t: BankTransaction;
  selectedTransactions: Map<Transaction, TransactionReconciliation | {amount: BigJsLibrary.BigJS}>
  initialSelectedTransactions: Map<Transaction, TransactionReconciliation>
  transactionsUnreconciledCached: Transaction[];

  constructor(private configuration: Configuration, private engineFactory: EngineFactory, public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController) {
    this.viewCtrl = viewCtrl;
    this.nav = nav;
    
    this.budget = dbms.getDb(navParams.data.budgetId);
    this.engine = engineFactory.getEngine(this.budget);
    this.t = this.budget.transactionProcessor.table(BankTransaction).by('id', navParams.data.bankTransactionId);

    this.initialSelectedTransactions = new Map();
    if (this.t.x.reconciliationRecords) {
      this.t.x.reconciliationRecords.forEach(transactionReconciliation => {
        let transaction = this.budget.transactionProcessor.table(Transaction).by('id', transactionReconciliation.transactionId);
        this.initialSelectedTransactions.set(transaction, transactionReconciliation);
      });
    }

    this.selectedTransactions = new Map(this.initialSelectedTransactions);

  }

  unreconciliedAndThisReconciledTransactions(): Transaction[] {

    let view = this.engine.getTransactionsUnreconciledView();
    if (view.sortDirty || view.resultsdirty || !this.transactionsUnreconciledCached) {
      this.transactionsUnreconciledCached = view.data();
      // TODO: Sorting based on match probability

      this.initialSelectedTransactions.forEach((r1, t1) => {
        let existing = this.transactionsUnreconciledCached.indexOf(t1);
        if (existing >= 0) this.transactionsUnreconciledCached.splice(existing, 1);
        this.transactionsUnreconciledCached.unshift(t1);
      });

      this.selectedTransactions.forEach((r1, t1) => {
        let existing = this.transactionsUnreconciledCached.indexOf(t1);
        if (existing < 0) this.transactionsUnreconciledCached.unshift(t1);
      });

    }

    return this.transactionsUnreconciledCached;

  }

  toggleSelected(transaction: Transaction) {
    if (this.selectedTransactions.has(transaction)) this.selectedTransactions.delete(transaction);
    else this.selectedTransactions.set(transaction, {amount: this.reconcileAmount(transaction)});

  }

  isSelected(transaction: Transaction): boolean {
    return this.selectedTransactions.has(transaction);
  }

  reconcileAmount(transaction: Transaction): BigJsLibrary.BigJS {

    if (this.selectedTransactions.has(transaction)) {
      // TODO: The case where an item is partially reconciled and there is some remaining, but it is selected
      // TODO: The case where it is initially reconciled, but for a DIFFERENT amount than to here.
      // Think about these cases, may need to display an extra field (or maybe, multiple?, transaction total, transaction left to reconcile, this reconciled (if different to total / remaining), eg. partial/split ) <= this last one will have a bit of logic to work out, as we need to add/remove this 

      // This is wrong, we want the remaining amount AND what we have already reconciled it for...
      return this.selectedTransactions.get(transaction).amount;
    }

    if (transaction.x.reconciliationRecords) {
      // TODO: Filter and remove "this" from the calc
      return (<TransactionReconciliation[]> transaction.x.reconciliationRecords).reduce((amt, t) => amt.minus(t.amount), transaction.amount);
    } else {
      return transaction.amount;
    }
  }

  reconciledTotal(): BigJsLibrary.BigJS {
    return Array.from(this.selectedTransactions.values()).reduce((tot, o) => tot.plus(o.amount), new Big('0'));
  }

  reconciledRemaining(): BigJsLibrary.BigJS {
    return this.t.amount.minus(this.reconciledTotal());
  }

  save() {

    this.selectedTransactions.forEach((reconcilation, transaction) => {
      if (!this.initialSelectedTransactions.has(transaction) || !this.initialSelectedTransactions.get(transaction).amount.eq(reconcilation.amount)) {
        let createTransactionReconciliation = new CreateTransactionReconciliation();
        createTransactionReconciliation.amount = reconcilation.amount;
        createTransactionReconciliation.transactionId = transaction.id;
        createTransactionReconciliation.bankTransactionId = this.t.id;

        if (this.t.accountId !== transaction.accountId) {
          // TODO: Update the transaction account Id
          // TODO: Transaction account change, show in UI
        }

        this.budget.applyTransaction(createTransactionReconciliation);
      }
    });

    this.initialSelectedTransactions.forEach((reconcilation, transaction) => {
      if (!this.selectedTransactions.has(transaction) || !this.selectedTransactions.get(transaction).amount.eq(reconcilation.amount)) {
        this.budget.deleteTransaction(this.budget.transactionProcessor.findTransactionsForRecord(reconcilation, CreateTransactionReconciliation)[0]);
      }
    });

  }

  close() {
    this.save();

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