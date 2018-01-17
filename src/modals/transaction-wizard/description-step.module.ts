import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransactionWizardDescriptionStep } from './description-step';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizardModule } from "./transaction-wizard.module";

@NgModule({
  declarations: [
    TransactionWizardDescriptionStep
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizardDescriptionStep),
    SharedModule,
    TransactionWizardModule
  ],
  exports: [
    TransactionWizardDescriptionStep
  ]
})
export class TransactionWizardDescriptionStepModule {}