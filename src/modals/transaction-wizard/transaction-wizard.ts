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


    showAccount: boolean = true;


    constructor(private navParams: NavParams, private viewCtrl: ViewController, private engineFactory: EngineFactory) {
        this.modalPageParams = this.navParams.data;
        this.modalPage = this.navParams.data.transactionId ? 'TransactionWizardViewPage' : 'TransactionWizardDescriptionStep';

        this.data = new TransactionWizardDataModel();
        this.data.transactionType = 'Expense';
        this.data.lines = [];


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
          this.data.expense = this.data.transaction.amounts[0].amount.cmp(Big(0)) >= 0;
          this.data.description = this.data.transaction.description;
          this.data.status = this.data.transaction.status;
          this.data.transaction.amounts.forEach(l => {
            this.data.lines.push({categoryId: l.categoryId, amount: l.amount.times(this.data.expense ? 1 : -1)+"", accountId: l.accountId});
          });
        } else {
          this.data.editing = false;
          this.data.expense = true;
          this.data.date = Utils.toIonicFromYYYYMMDD(this.navParams.data.date || Utils.nowYYYYMMDD());
          this.data.description = this.navParams.data.description;
          this.data.accountId = this.navParams.data.accountId;
          this.data.status = 'realised';
          //this.data.amount = this.navParams.data.amount ? this.navParams.data.amount + '' : undefined;
          //if (this.data.amount) this.data.expense = new Big(this.data.amount).cmp(Big(0)) >= 0;
          this.data.lines.push({
            categoryId: this.data.category ? this.data.category.id : undefined,
            amount: "",
            accountId: this.data.accountId
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
        t.status = this.data.status;
    
        // Always clear out the records in the transaction and not "merge" them
        // Our indexes should be preserved... - TODO Not sure how to do that if a line is deleted
        t.amounts = [];
        this.data.lines.forEach((line) => {
          t.amounts.push({
            categoryId: line.categoryId,
            amount: new Big((line.amount || '0').replace(',', '')).times(this.data.expense ? 1 : -1),
            accountId: Number(line.accountId)
          });
        });
    
    
        this.data.engine.db.applyTransaction(t);

        this.dismiss();
    }

    delete() {
        this.data.engine.db.deleteTransaction(this.data.transaction);    
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
            'TransactionWizardDescriptionStep',
            'TransactionWizardAmountStep'
        ]

        if (this.nav.getActive().name === 'TransactionWizardDescriptionStep') {
            this.nav.push('TransactionWizardAmountStep', this.modalPageParams); 
        } else {
            this.nav.setRoot('TransactionWizardViewPage', this.modalPageParams); 
        }




    }

    back() {
        this.nav.pop();
    }

    canGoBack() {
        return this.nav.canGoBack();
    }
    
    currentPage() {
        this.nav.getActive().component;
    }
}