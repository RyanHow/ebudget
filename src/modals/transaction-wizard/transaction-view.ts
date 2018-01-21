import {Component} from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { IonicPage, ViewController, PopoverController, Platform } from "ionic-angular";
import { TransactionWizardDataModel } from "./transaction-data-model";
import { TransactionWizardPage } from "./transaction-wizard-page";

@IonicPage()
@Component({
  templateUrl: 'transaction-view.html'
})
export class TransactionWizardViewPage implements TransactionWizardPage {
    
    public static_name = 'TransactionWizardViewPage';

    data: TransactionWizardDataModel;

    constructor(private wizard: TransactionWizard , private popoverController: PopoverController, private platform: Platform) {
      this.data = this.wizard.data;
    }

    more(event) {
        let popover = this.popoverController.create('TransactionWizardViewMenu', {wizard: this.wizard});
        popover.present({ev: event});
    }

    ionViewDidEnter() {
        this.wizard.currentPage = this;
    }

}
