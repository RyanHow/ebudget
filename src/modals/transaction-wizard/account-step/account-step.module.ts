import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransactionWizardAccountStep } from './account-step';
import { SharedModule } from "../../../app/shared.module";
import { TransactionWizardModule } from "../transaction-wizard.module";

@NgModule({
  declarations: [
    TransactionWizardAccountStep
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizardAccountStep),
    SharedModule,
    TransactionWizardModule
  ],
  exports: [
    TransactionWizardAccountStep
  ]
})
export class TransactionWizardAmountStepModule {}