import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransactionWizardAmountStep } from './amount-step';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizardModule } from "./transaction-wizard.module";

@NgModule({
  declarations: [
    TransactionWizardAmountStep
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizardAmountStep),
    SharedModule,
    TransactionWizardModule
  ],
  exports: [
    TransactionWizardAmountStep
  ]
})
export class TransactionWizardAmountStepModule {}