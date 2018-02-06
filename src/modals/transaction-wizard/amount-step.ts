import {Component, ElementRef} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { IonicPage } from "ionic-angular";
import { TransactionWizardDataModel } from "./transaction-data-model";
import { TransactionWizardPage } from "./transaction-wizard-page";
import { Account } from "../../data/records/account";

@IonicPage()
@Component({
  templateUrl: 'amount-step.html'
})
export class TransactionWizardAmountStep implements TransactionWizardPage {

  public static_name = 'TransactionWizardAmountStep';

  data: TransactionWizardDataModel;

  accounts: Account[];

  constructor(private wizard: TransactionWizard, private elementRef: ElementRef) {
    this.data = this.wizard.data;
    this.accounts = this.data.engine.getAccounts();
  }

  ionViewDidEnter() {
    this.wizard.currentPage = this;
    setTimeout(() => this.elementRef.nativeElement.querySelector('input').focus(), 500);
  }

  selectAccount(accountId: number) {
    if (this.data.accountLines.length === 0) {
      this.data.accountLines.push({
        accountId: accountId,
        amount: "0", // Note: This is set on "leave"
        negative: this.data.negative
      });
    } else if (this.data.accountLines[0].accountId === accountId) {
      this.data.accountLines[0].accountId = null;
    } else {
      this.data.accountLines[0].accountId = accountId;
    }
  }

  ionViewWillLeave() {
    if (this.data.accountLines.length > 0) {
      this.data.accountLines[0].amount = this.data.lines[0].amount;
    }
  }
}