import {Component, ElementRef} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { IonicPage } from "ionic-angular";
import { TransactionWizardDataModel } from "./transaction-data-model";
import { TransactionWizardPage } from "./transaction-wizard-page";

@IonicPage()
@Component({
  templateUrl: 'amount-step.html'
})
export class TransactionWizardAmountStep implements TransactionWizardPage {
  
  public static_name = 'TransactionWizardAmountStep';

  data: TransactionWizardDataModel;

  constructor(private wizard: TransactionWizard, private elementRef: ElementRef) {
    this.data = this.wizard.data;

  }

  ionViewDidEnter() {
    this.wizard.currentPage = this;
    setTimeout(() => this.elementRef.nativeElement.querySelector('input').focus(), 500);
  }
}