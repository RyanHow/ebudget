import { Component } from "@angular/core";
import { Nav, NavParams, ViewController, IonicPage } from "ionic-angular";

@IonicPage()
@Component({
    templateUrl: 'transaction-wizard.html'
})
export class TransactionWizard {
    modalPage: any;
    modalPageParams: any;

    constructor(private navParams: NavParams, private viewCtrl: ViewController) {
        
    }

    ngOnInit() {
        // TODO: Create / edit params here to start up the wizard

        this.modalPageParams = this.navParams.data;
        this.modalPage = "TransactionWizardDescriptionStep";
    }

    dismiss() {
        this.viewCtrl.dismiss();
      }
    
}