import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizard } from "./transaction-wizard";
import { TransactionWizardStepHeader } from "./step-header";

@NgModule({
  declarations: [
    TransactionWizard,
    TransactionWizardStepHeader
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizard),
    SharedModule
  ],
  exports: [
    TransactionWizard,
    TransactionWizardStepHeader
  ]
})
export class TransactionWizardModule {}