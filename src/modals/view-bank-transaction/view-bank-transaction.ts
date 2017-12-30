import {NavController, ViewController, NavParams, AlertController, ModalController} from 'ionic-angular';
import {Db} from '../../db/db';
import {Dbms} from '../../db/dbms';
import {Configuration} from '../../services/configuration-service';
import {Component} from '@angular/core';
import { BankTransaction } from "../../data/records/bank-transaction";
import { Transaction } from "../../data/records/transaction";
import { TransactionReconciliation } from "../../data/records/transaction-reconciliation";
import { EngineFactory } from "../../engine/engine-factory";
import { Engine } from "../../engine/engine";
import { Big } from 'big.js';
import { CreateTransactionReconciliation } from "../../data/transactions/create-transaction-reconciliation";
import { AddEditSplitTransactionModal } from "../add-edit-split-transaction/add-edit-split-transaction";

@Component({
  templateUrl: 'view-bank-transaction.html'
})
export class ViewBankTransactionModal {

  engine: Engine;
  budget: Db;
  t: BankTransaction;
  selectedTransactions: Map<Transaction, TransactionReconciliation | {amount: Big, transactionAmountOverride?: boolean}>
  initialSelectedTransactions: Map<Transaction, TransactionReconciliation>
  transactionsUnreconciledCached: Transaction[];
  forceRefresh: boolean;

  constructor(private configuration: Configuration, private engineFactory: EngineFactory, public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController, private modalController: ModalController) {
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
    if (view.sortDirty || view.resultsdirty || this.forceRefresh || !this.transactionsUnreconciledCached) {
      this.forceRefresh = false;
      this.transactionsUnreconciledCached = view.data();

      // TODO: Sorting based on match probability
      // TODO: Group. ie. transactions on this account, transactions with no account, transactions on another account...


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
    if (this.selectedTransactions.has(transaction)) {
      // TODO: Message if the transaction will be restored to it's initial amount and/or account - only for already saved reconciliations - not for new ones (you'd assume it would be)
      // TODO: This needs to be implemented in the dbTransaction so when the "undo" or "update" event happens then it correctly restores the initial transaction

      this.selectedTransactions.delete(transaction);
    } else {
      if (transaction.accountId != null && transaction.accountId != this.t.accountId) {
        this.alertController.create({message: "The selected transaction is logged under a different account (TODO: Account name) in the budget. By reconciling against this bank account it will be changed to be logged under (TODO: This account name)."}).present();
      }
      if (! this.reconcileAmount(transaction).times(-1).eq(this.reconciledRemaining())) {
        this.alertController.create({
          message: "I've updated the budget amount from (TODO: Amount) to (TODO: New Amount) to match the bank transaction.",
          buttons: [
            {
              text: 'Undo',
              role: 'cancel',
              handler: data => {
                this.selectedTransactions.set(transaction, {amount: this.reconcileAmount(transaction)});
              }
            },
            {
              text: 'OK',
              handler: data => {                
                // TODO: If the amount is subsequently edited, then this needs to be addresses again
                this.selectedTransactions.set(transaction, {amount: this.reconciledRemaining().times(-1), transactionAmountOverride: true});
              }
            }
          ]
        }).present();
      } else {
        this.selectedTransactions.set(transaction, {amount: this.reconcileAmount(transaction)});
      }
    }

  }

  isSelected(transaction: Transaction): boolean {
    return this.selectedTransactions.has(transaction);
  }

  reconcileAmount(transaction: Transaction): Big {

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

  reconciledTotal(): Big {
    return Array.from(this.selectedTransactions.values()).reduce((tot, o) => tot.plus(o.amount), new Big('0'));
  }

  reconciledRemaining(): Big {
    return this.t.amount.minus(this.reconciledTotal());
  }

  save() {

    this.selectedTransactions.forEach((reconcilation, transaction) => {
      if (!this.initialSelectedTransactions.has(transaction) || !this.initialSelectedTransactions.get(transaction).amount.eq(reconcilation.amount)) {
        let createTransactionReconciliation = new CreateTransactionReconciliation();
        createTransactionReconciliation.amount = reconcilation.amount;
        createTransactionReconciliation.transactionId = transaction.id;
        createTransactionReconciliation.bankTransactionId = this.t.id;
        if (reconcilation.transactionAmountOverride) createTransactionReconciliation.transactionAmountOverride = true;

        this.budget.applyTransaction(createTransactionReconciliation);
      } else {
        // TODO: Update as needed (and only if needed)
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

  createTransaction() {
    let modal = this.modalController.create(AddEditSplitTransactionModal, {budgetId: this.budget.id, accountId: this.t.accountId, amount: this.reconciledRemaining().times(-1), description: this.t.description, date: this.t.date});
    modal.onDidDismiss(data => {
      if (data && data.transactions) {
        data.transactions.forEach(transaction => {
          this.selectedTransactions.set(transaction, {amount: transaction.amount});
          this.forceRefresh = true;
        });
      }
    });
    modal.present();
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