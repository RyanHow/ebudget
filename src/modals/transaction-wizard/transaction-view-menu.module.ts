import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizardModule } from "./transaction-wizard.module";
import { TransactionWizardViewMenu } from "./transaction-view-menu";

@NgModule({
  declarations: [
    TransactionWizardViewMenu
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizardViewMenu),
    SharedModule,
    TransactionWizardModule
  ],
  exports: [
    TransactionWizardViewMenu
  ]
})
export class TransactionWizardViewMenuModule {}

