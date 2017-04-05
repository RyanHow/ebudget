import {NavController, NavParams} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Engine} from '../../engine/engine';
import {EngineFactory} from '../../engine/engine-factory';
import {Account} from '../../data/records/account';

@Component({
  templateUrl: 'account.html'
})
export class AccountPage {
  
  engine: Engine;
  account: Account;

  constructor(private nav: NavController, private dbms: Dbms, private navParams: NavParams, private engineFactory: EngineFactory) {
    this.engine = this.engineFactory.getEngineById(navParams.data.budgetId);
    this.account = this.engine.getRecordById(Account, navParams.data.accountId);
    
  }
  
}
