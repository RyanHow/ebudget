import {Component} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { IonicPage } from "ionic-angular";

@IonicPage()
@Component({
  templateUrl: 'description-step.html'
})
export class TransactionWizardDescriptionStep {

    constructor(private transactionWizard: TransactionWizard) {

    }
}