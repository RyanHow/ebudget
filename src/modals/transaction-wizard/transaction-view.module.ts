import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedModule } from "../../app/shared.module";
import { TransactionWizardModule } from "./transaction-wizard.module";
import { TransactionWizardViewPage } from "./transaction-view";
import { TransactionWizardViewMenuModule } from "./transaction-view-menu.module";

@NgModule({
  declarations: [
    TransactionWizardViewPage
  ],
  imports: [
    IonicPageModule.forChild(TransactionWizardViewPage),
    SharedModule,
    TransactionWizardModule,
    TransactionWizardViewMenuModule
  ],
  exports: [
    TransactionWizardViewPage
  ]
})
export class TransactionWizardViewPageModule {}

