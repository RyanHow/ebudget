import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizardModule } from "./transaction-wizard.module";
import { TransactionWizardStartStep } from "./start-step";

@NgModule({
  declarations: [
    TransactionWizardStartStep
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizardStartStep),
    SharedModule,
    TransactionWizardModule
  ],
  exports: [
    TransactionWizardStartStep
  ]
})
export class TransactionWizardStartStepModule {}