import { Component, ViewChild } from "@angular/core";
import { Nav, NavParams, ViewController, IonicPage } from "ionic-angular";
import { CreateSplitTransaction } from "../../data/transactions/create-split-transaction";
import { Category } from "../../data/records/category";
import { Engine } from "../../engine/engine";
import { Utils } from "../../services/utils";
import { Transaction } from "../../data/records/transaction";
import { EngineFactory } from "../../engine/engine-factory";
import { TransactionWizardDataModel } from "./transaction-data-model";
import { Big } from 'big.js';
import { TransactionWizardPage } from "./transaction-wizard-page";
import { ReconcileBankTransaction } from "../../data/transactions/reconcile-bank-transaction";
import { AccountTransaction } from "../../data/records/account-transaction";
import { BankTransaction } from "../../data/records/bank-transaction";

@IonicPage()
@Component({
    templateUrl: 'transaction-wizard.html'
})
export class TransactionWizard {
    modalPage: any;
    modalPageParams: any;

    @ViewChild('nav')
    nav: Nav;

    data: TransactionWizardDataModel;

    currentPage: TransactionWizardPage;

    //showAccount: boolean = true;


    constructor(private navParams: NavParams, private viewCtrl: ViewController, private engineFactory: EngineFactory) {
        this.modalPageParams = this.navParams.data;
        this.modalPage = this.navParams.data.transactionId ? 'TransactionWizardViewPage' : 'TransactionWizardAccountStep';

        this.data = new TransactionWizardDataModel();
        this.data.transactionType = 'Expense';
        this.data.lines = [];
        this.data.accountLines = [];
        this.data.reconciliation = [];

        this.data.engine = engineFactory.getEngineById(navParams.data.budgetId);

        if (navParams.data.categoryId != null) {
          this.data.engine.getCategory(navParams.data.categoryId);
          this.data.category = this.data.engine.db.transactionProcessor.table(Category).by('id', navParams.data.categoryId);
        }
        
        if (navParams.data.transactionId) {
          this.data.editing = true;
          let transactionRecord = this.data.engine.db.transactionProcessor.table(Transaction).by('id', navParams.data.transactionId);
          this.data.transaction = this.data.engine.db.transactionProcessor.findTransactionsForRecord(transactionRecord, CreateSplitTransaction)[0];
    
          if (this.data.category == null) {
            this.data.category = this.data.engine.db.transactionProcessor.table(Category).by('id', <any> this.data.transaction.amounts[0].categoryId);
          }

    
          this.data.date = Utils.toIonicFromYYYYMMDD(this.data.transaction.date);
          this.data.description = this.data.transaction.description;
          
          this.data.transaction.amounts.forEach(l => {
            this.data.lines.push({categoryId: l.categoryId, amount: l.amount.abs().toString(), negative: l.amount.gt(0)});
          });

          if (this.data.transaction.accountAmounts) {
              this.data.transaction.accountAmounts.forEach(l => {
              this.data.accountLines.push({accountId: l.accountId, amount: l.amount.abs().toString(), negative: l.amount.gt(0)});
            });
          }

          this.data.engine.db.transactionProcessor.findRecordsForTransaction(this.data.transaction, AccountTransaction).forEach(at => {
              if (at.x.reconciliationRecords) at.x.reconciliationRecords.forEach(r => {
                let bankTransaction = this.data.engine.db.transactionProcessor.table(BankTransaction).by('id', <any> r.bankTransactionId);
                  this.data.reconciliation.push({bankTransaction: bankTransaction, accountId: at.accountId, amount: r.amount, transaction: this.data.engine.db.transactionProcessor.findTransactionsForRecord(r, ReconcileBankTransaction)[0]});
              })
          })


          this.data.transactionType = this.data.total.eq(0) ? 'Transfer' : this.data.total.gt(0) ? 'Expense' : 'Money In';
          this.data.negative = this.data.transactionType === 'Expense';
          
          this.data.snapshotOriginal();

        } else {
          this.data.editing = false;
          this.data.transactionType = this.navParams.data.transactionType || 'Expense';
          this.data.negative = this.data.transactionType === 'Expense';
          this.data.date = Utils.toIonicFromYYYYMMDD(this.navParams.data.date || Utils.nowYYYYMMDD());
          this.data.description = this.navParams.data.description;
          this.data.lines.push({
            categoryId: this.data.category ? this.data.category.id : undefined,
            amount: this.navParams.data.amount ? this.navParams.data.amount + '' : '',
            negative: this.data.negative
          });

          
        }
    

    }

    done() {
        var t: CreateSplitTransaction;
        if (! this.data.editing) {
          t = new CreateSplitTransaction();
        } else {
          t = this.data.transaction;
        }    
        
        t.date = Utils.toYYYYMMDDFromIonic(this.data.date);
        t.description = this.data.description;
    
        // TODO: Preversing indexes on editing for any linked records ??

        // Always clear out the records in the transaction and not "merge" them
        // Our indexes should be preserved... - TODO Not sure how to do that if a line is deleted!
        t.amounts = [];
        this.data.lines.forEach((line) => {
          t.amounts.push({
            categoryId: line.categoryId,
            amount: new Big((line.amount || '0').replace(',', '')).times(line.negative ? 1 : -1) // Note: Negative is inverted here
          });
        });
    
        // TODO: only 1 of each account ID - merge them first ?
        t.accountAmounts = [];
        this.data.accountLines.forEach((line) => {
            if (line.accountId != null && line.amount != null && line.amount.trim() !== '0' && line.amount.length > 0) {
                t.accountAmounts.push({
                    accountId: line.accountId,
                    amount: new Big((line.amount || '0').replace(',', '')).times(line.negative ? 1 : -1) // Note: Negative is inverted here
                });
            }
        });

    
        this.data.engine.db.applyTransaction(t);

        // Reconciliation: TODO Only at the moment if it is new, we can't handle "editing"

        if (!this.data.editing) {
            this.data.reconciliation.forEach(r => {
                // TODO: create a new reconcile transaction and apply for each
                let rbt = new ReconcileBankTransaction();
                // TODO: Do we do this by index OR do we search the account transactions that are for the record?
                //let accountAmountIndex = t.accountAmounts.findIndex(line => line.accountId === r.accountId);
                let accountTransactions = this.data.engine.db.transactionProcessor.findRecordsForTransaction(t, AccountTransaction);
                rbt.accountTransactionId = accountTransactions.find(t => t.accountId === r.accountId).id;

                rbt.bankTransactionId = r.bankTransaction.id;
                rbt.amount = r.amount;
                this.data.engine.db.applyTransaction(rbt);

            });
        }

        this.dismiss();
    }

    delete() {
        this.data.engine.db.deleteTransaction(this.data.transaction);    

        this.data.reconciliation.forEach(r => {
            if (r.transaction) this.data.engine.db.deleteTransaction(r.transaction);
        });

        this.dismiss();
    }

    ngOnInit() {

    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    next() {
        // TODO: Move this to a separate class ?
        // Which simply handles the "next" step and when done - back can be handle by the nav stack

        let wizardPages = [
            'TransactionWizardAccountStep',
            'TransactionWizardDescriptionStep',
            'TransactionWizardAmountStep',
            'TransactionWizardDescriptionQuickStep'
        ]

        if (this.currentPage.static_name === 'TransactionWizardAccountStep' && (this.data.description == null || this.data.description.trim().length === 0)) {
            this.navPush('TransactionWizardDescriptionQuickStep');
            return;
        }
        
        if ((this.currentPage.static_name === 'TransactionWizardDescriptionStep' || this.currentPage.static_name === 'TransactionWizardAccountStep') && (this.data.total.eq(0) && this.data.lines.length < 2)) {
            this.navPush('TransactionWizardAmountStep');
            return;
        }

        this.navPush('TransactionWizardViewPage'); // TODO: Need to navroot from here once gone to next page, but not now

            
    }

    navPush(page: string): Promise<any> {
        return this.nav.push(page, this.modalPageParams, {animate: false, keyboardClose: false});
    }

    navRoot(page: string): Promise<any> {
        return this.nav.setRoot(page, this.modalPageParams);
    }

    back() {
        this.nav.pop();
    }

    canGoBack() {
        return this.nav.canGoBack();
    }
    
}