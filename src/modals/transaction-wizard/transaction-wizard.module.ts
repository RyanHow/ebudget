import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizard } from "./transaction-wizard";
import { TransactionWizardStepHeader } from "./step-header";
import { ReconciledPanel } from "./reconciled-panel";

@NgModule({
  declarations: [
    TransactionWizard,
    TransactionWizardStepHeader,
    ReconciledPanel
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizard),
    SharedModule
  ],
  exports: [
    TransactionWizard,
    TransactionWizardStepHeader,
    ReconciledPanel
  ]
})
export class TransactionWizardModule {}