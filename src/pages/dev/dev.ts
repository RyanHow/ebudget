import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';

@Component({
  templateUrl: 'dev.html'
})
export class DevPage {
  
  testamount1 = 'hi there';
  _testamount2;
  get testamount2() {
    return this._testamount2;
  }
  set testamount2(value) {
    this._testamount2 = value.toUpperCase();
  }
  testamount3 = 'ASD';
  
  constructor(private nav: NavController, private dbms: Dbms) {

  }
    
  toUpper3(nv: string) {
    this.testamount3 = nv.toUpperCase();
  }

  testError() {
    throw new Error('Muahahaha');
  }
}
