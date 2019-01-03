import {Component, ElementRef} from '@angular/core';
import { TransactionWizard } from "../transaction-wizard";
import { IonicPage } from "ionic-angular";
import { TransactionWizardDataModel } from "../transaction-data-model";
import { TransactionWizardPage } from "../transaction-wizard-page";
import { Account } from "../../../data/records/account";

@IonicPage()
@Component({
  templateUrl: 'account-step.html'
})
export class TransactionWizardAccountStep implements TransactionWizardPage {

  public static_name = 'TransactionWizardAccountStep';

  data: TransactionWizardDataModel;

  accounts: Account[];

  constructor(private wizard: TransactionWizard, private elementRef: ElementRef) {
    this.data = this.wizard.data;
    this.accounts = this.data.engine.getAccounts();
  }

  ionViewDidEnter() {
    this.wizard.currentPage = this;
  }

  selectAccount(accountId: number) {
    if (this.data.accountLines.length === 0) {
      this.data.accountLines.push({
        accountId: accountId,
        amount: "0",
        negative: this.data.negative
      });
      this.wizard.next();
    } else if (this.data.accountLines[0].accountId === accountId) {
      this.data.accountLines[0].accountId = null;
    } else {
      this.data.accountLines[0].accountId = accountId;
    }
  }
}