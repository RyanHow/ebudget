import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Logger} from '../../services/logger';
import {Configuration} from '../../services/configuration-service';
import {LoggerUINotifierAppender} from '../../services/logger-ui-notifier-appender';

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
  
  constructor(private nav: NavController, private dbms: Dbms, public configuration: Configuration) {

  }
    
  toUpper3(nv: string) {
    this.testamount3 = nv.toUpperCase();
  }

  testError() {
    Logger.get("dev").info({message: "about to throw an error"}, "And trying a multi part log before it");
    throw new Error('Muahahaha');
  }

  testLogError() {
    Logger.get("dev").info({message: "about to log an error"});
    Logger.get('dev').error("Logging an error");
  }

  testPromiseRejection() {
    Logger.get("dev").info("Unhandled Promise Rejection Test");
    new Promise((resolve, reject) => {
      reject("Simulated Error");
    }).then(() => {Logger.get('dev').info('This should never be logged')});
  }

  openErrorHandler() {
    LoggerUINotifierAppender.instance.handler.handle('Opening Error Handler');
  }

}
