import {ModalController, NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {AddBudgetModal} from '../../modals/add-budget/add-budget';
import {ShareBudgetModal} from '../../modals/share-budget/share-budget';
import {BudgetPage} from '../../pages/budget/budget';
import {Dbms} from '../../db/dbms';
import {InitBudgetTransaction} from '../../data/transactions/init-budget-transaction';

@Component({
  templateUrl: 'home.html'
})
export class HomePage {
  projectMenuEnabled: boolean;
  
  constructor(private nav: NavController, private dbms: Dbms, private modalController: ModalController) {
    this.nav = nav;
    this.projectMenuEnabled = true;
    this.dbms = dbms;
  }
  
  addBudget() {
    let modal = this.modalController.create(AddBudgetModal);

    modal.onDidDismiss((data) => {
      if (data && data.budgetName !== '') {
        this.dbms.createDb().then(db => {
          db.activate();
          let t = new InitBudgetTransaction();
          t.budgetName = data.budgetName;
          db.applyTransaction(t);
          db.deactivate();

          this.nav.setRoot(BudgetPage, {'budget' : db});
        });
      }
    });
    

    modal.present();
  }
  
  linkBudget() {
    let modal = this.modalController.create(ShareBudgetModal);
    modal.onDidDismiss((data) => {
      if (data && data.newBudget) {
        this.nav.setRoot(BudgetPage, {'budget': data.newBudget});
      }
    });
    modal.present();
    
  }
    
}