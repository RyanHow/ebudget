import {Component, ViewChild, ElementRef} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { IonicPage } from "ionic-angular";
import { TransactionWizardDataModel } from "./transaction-data-model";

@IonicPage()
@Component({
  templateUrl: 'description-step.html'
})
export class TransactionWizardDescriptionStep {

  public static_name = 'TransactionWizardDescriptionStep';

  data: TransactionWizardDataModel;

  constructor(private wizard: TransactionWizard, private elementRef: ElementRef) {
    if (!this.wizard) return; // Allow for parameterless initialisation so we can get the static_name field above

    this.data = this.wizard.data;
  }

  ionViewDidEnter() {
    this.wizard.currentPage = this;
    setTimeout(() => this.elementRef.nativeElement.querySelector('input').focus(), 500);
  }
}