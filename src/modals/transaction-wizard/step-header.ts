import {Component, Input} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";

@Component({
  selector: 'transaction-wizard-step-header',
  templateUrl: 'step-header.html'
})
export class TransactionWizardStepHeader {

    @Input()
    form: any;

    constructor(private transactionWizard: TransactionWizard) {

    }

    cancel() {
        this.transactionWizard.dismiss();
    }
}