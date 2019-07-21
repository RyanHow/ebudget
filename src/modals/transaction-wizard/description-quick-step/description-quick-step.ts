import {Component, ViewChild, ElementRef} from '@angular/core';
import { TransactionWizard } from "../transaction-wizard";
import { IonicPage } from "ionic-angular";
import { TransactionWizardDataModel } from "../transaction-data-model";
import { TransactionWizardPage } from "../transaction-wizard-page";

@IonicPage()
@Component({
  templateUrl: 'description-quick-step.html'
})
export class TransactionWizardDescriptionQuickStep implements TransactionWizardPage {

  public static_name = 'TransactionWizardDescriptionQuickStep';

  data: TransactionWizardDataModel;


  constructor(private wizard: TransactionWizard, private elementRef: ElementRef) {
    if (!this.wizard) return;

    this.data = this.wizard.data;
  }

  ionViewDidEnter() {
    this.wizard.currentPage = this;
    //setTimeout(() => this.elementRef.nativeElement.querySelector('input').focus(), 500);

  }



}