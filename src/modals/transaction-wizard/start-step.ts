import {Component, ViewChild, ElementRef} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { IonicPage } from "ionic-angular";
import { TransactionWizardDataModel } from "./transaction-data-model";
import { BankTransaction } from "../../data/records/bank-transaction";
import { TransactionWizardPage } from "./transaction-wizard-page";
import { Big } from "big.js";
import { BankSync } from "../../bank/bank-sync";
import { BankSyncUtils } from "../../bank/bank-sync-utils";
import { Notifications } from "../../services/notifications";
import { BankLinkLocal } from "../../bank/bank-link-local";
import moment from 'moment';

@IonicPage()
@Component({
  templateUrl: 'start-step.html'
})
export class TransactionWizardStartStep implements TransactionWizardPage {

  public static_name = 'TransactionWizardStartStep';

  data: TransactionWizardDataModel;

  availableBankTransactionArray: BankTransaction[];

  constructor(private wizard: TransactionWizard, private elementRef: ElementRef, private bankSync: BankSync, private notifications: Notifications, private bankLinkLocal: BankLinkLocal) {
    if (!this.wizard) return;

    this.data = this.wizard.data;
    this.availableBankTransactionArray = [];
  }

  availableBankTransactions(): BankTransaction[] {
    let sourceData = this.data.engine.bankTransactionUnreconciledDynamicView.data();
    let zero = new Big(0); // TODO: Filter based off money in or expense
    let filteredData = this.data.transactionType === 'Expense' ? sourceData.filter(b => b.amount < zero) : this.data.transactionType === 'Money In' ? sourceData.filter(b => b.amount > zero) : sourceData;
    filteredData = filteredData.filter(b => !b.flagRemoved);
    this.availableBankTransactionArray.length = 0;
    this.availableBankTransactionArray.push(...filteredData);
    return this.availableBankTransactionArray;
  }


  ionViewDidEnter() {
    this.wizard.currentPage = this;
    setTimeout(() => this.elementRef.nativeElement.querySelector('input').focus(), 500);

  }

  isCurrentValidAutomaticBankLinks() {
    // TODO Combine with main menu (and probably other places)

    // TODO
    // And need a "cheap" way to get this value - perhaps update it off transactions. Basically we want a few criteria - a bank link is set up, it is linked to an account and all credentials are in there so it is automatic...
    // Note: Maybe not the automatic thing, coz we will have a prompting mechanism...
    // Really we can just getAccounts() and find bankLinkId != null
    // But also if it is valid for this particular "device" (and the user of the device)

    return true;

  }

  runBankLinks() {
    // TODO Combine with main menu (and probably other places)

    // TODO: Combine the notifications / status for these to running and complete and complete / with errors

    // TODO: In this case don't show notifications? Instead display a warning or needs help icon?, then clicking can open an action sheet ?

    this.data.engine.getBankLinks().forEach(bl => {
      let monitor = BankSyncUtils.createMonitorWithNotifications(this.notifications);
      this.bankSync.sync(bl, this.data.engine, undefined, monitor, true);
    });
  }
  
  latestSyncDate(): string {

    // TODO: This is expensive - don't think we should use it in an angular binding ?

    let bankLinks = this.data.engine.getBankLinks();
    let maxTime = bankLinks.map(bankLink => {
        let info = this.bankLinkLocal.getInfo(bankLink.uuid);
        return info.lastSync;
    }).reduce((max, val) => Math.max(max, val), 0);

    if (!maxTime) return "";

    // TODO: This will only work on the device that synced, it needs to work on other devices too (the best we can do is check the time of the latest merge)

    return "Updated " + moment(maxTime).fromNow();

  }

  selectBankTransaction(bankTransaction: BankTransaction) {
    this.data.lines[0].amount = bankTransaction.amount.toString();
    this.data.accountLines.push({accountId: bankTransaction.accountId, amount: bankTransaction.amount.toString(), negative: this.data.negative});
    this.data.reconciliation.push({bankTransaction: bankTransaction, accountId: bankTransaction.accountId, amount: bankTransaction.amount});
    this.wizard.next();
  }


}