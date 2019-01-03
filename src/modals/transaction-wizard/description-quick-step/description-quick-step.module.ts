import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedModule } from "../../../app/shared.module";
import { TransactionWizardModule } from "../transaction-wizard.module";
import { TransactionWizardDescriptionQuickStep } from "./description-quick-step";

@NgModule({
  declarations: [
    TransactionWizardDescriptionQuickStep
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizardDescriptionQuickStep),
    SharedModule,
    TransactionWizardModule
  ],
  exports: [
    TransactionWizardDescriptionQuickStep
  ]
})
export class TransactionWizardDescriptionQuickStepModule {}