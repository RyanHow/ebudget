import { Component } from "@angular/core";
import { TransactionWizard } from "./transaction-wizard";
import { TransactionWizardDataModel } from "./transaction-data-model";

@Component({
    selector: 'reconciled-panel',
    templateUrl: 'reconciled-panel.html'
})
export class ReconciledPanel {
    
    data: TransactionWizardDataModel;

    constructor(private wizard: TransactionWizard) {
        this.data = wizard.data;        
    }
}