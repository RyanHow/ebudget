import {Component} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { IonicPage, ViewController, PopoverController, Platform } from "ionic-angular";
import { TransactionWizardDataModel } from "./transaction-data-model";

@IonicPage()
@Component({
  templateUrl: 'transaction-view.html'
})
export class TransactionWizardViewPage {
    data: TransactionWizardDataModel;

    constructor(private wizard: TransactionWizard , private popoverController: PopoverController, private platform: Platform) {
      this.data = this.wizard.data;

    }

    more(event) {
        let popover = this.popoverController.create('TransactionWizardViewMenu', {wizard: this.wizard});
        popover.present({ev: event});
    }

}
