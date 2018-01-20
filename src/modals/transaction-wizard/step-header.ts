import {Component, Input} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { TransactionWizardDataModel } from "./transaction-data-model";
import { Platform } from "ionic-angular";

@Component({
  selector: 'transaction-wizard-step-header',
  templateUrl: 'step-header.html'
})
export class TransactionWizardStepHeader {

    @Input()
    form: any;
    data: TransactionWizardDataModel;

    constructor(private wizard: TransactionWizard, private platform: Platform) {
        this.data = wizard.data;
    }

    cancel() {
        this.wizard.dismiss();
    }
}