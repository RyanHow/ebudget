import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizard } from "./transaction-wizard";
import { TransactionWizardStepHeader } from "./step-header";
import { ReconciledPanel } from "./reconciled-panel";
import { TransactionWizardReconciliationFooter } from "./reconciliation-footer/reconciliation-footer";

@NgModule({
  declarations: [
    TransactionWizard,
    TransactionWizardStepHeader,
    TransactionWizardReconciliationFooter,
    ReconciledPanel
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizard),
    SharedModule
  ],
  exports: [
    TransactionWizard,
    TransactionWizardStepHeader,
    TransactionWizardReconciliationFooter,
    ReconciledPanel
  ]
})
export class TransactionWizardModule {}