import { Component } from '@angular/core';
import { TransactionWizard } from "./transaction-wizard";
import { ViewController, IonicPage } from "ionic-angular";

@IonicPage()
@Component({
  template: `
    <button ion-item detail-none no-lines (click)="edit()"><ion-icon item-start name="build"></ion-icon>Edit</button>
    <button ion-item detail-none no-lines (click)="delete()"><ion-icon item-start name="trash"></ion-icon>Delete</button>
  `
})
export class TransactionWizardViewMenu {

  wizard: TransactionWizard;

  constructor(private viewCtrl: ViewController) {
    this.wizard = this.viewCtrl.getNavParams().data.wizard;

  }

  delete() {
    this.viewCtrl.dismiss(undefined, undefined, { animate: false, duration: 0 }).then(() => { this.wizard.delete() });
  }

  edit() {
    this.viewCtrl.dismiss(undefined, undefined, { animate: false, duration: 0 }).then(() => {
      this.wizard.nav.push('TransactionWizardDescriptionStep', this.wizard.modalPageParams);
    });
    
  }

}