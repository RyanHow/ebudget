import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Logger} from '../../services/logger';
import {Configuration} from '../../services/configuration-service';
import {Notifications} from '../../services/notifications';
import {LoggerUINotifierAppender} from '../../services/logger-ui-notifier-appender';
import {InAppBrowser} from 'ionic-native';
import cronstrue from 'cronstrue';

@Component({
  templateUrl: 'dev.html'
})
export class DevPage {
  
  testamount1 = 'hi there';
  _testamount2;

  public cronInput: string;

  get testamount2() {
    return this._testamount2;
  }
  set testamount2(value) {
    this._testamount2 = value.toUpperCase();
  }
  testamount3 = 'ASD';
  
  constructor(private nav: NavController, private dbms: Dbms, public configuration: Configuration, private notifications: Notifications) {
    
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

  launchInAppBrowserTest1() {
    let browser = new InAppBrowser('https://www.google.com', '_blank');
    let subscription = browser.on('loadstop').subscribe(ev => {
        let js = 'alert(5 + 7);location.href="http://www.example.com";5 + 7;';
        Logger.get("dev").info("executing js: " + js);
        browser.executeScript({code: js}).then((val) => {
          Logger.get("dev").info(val);
          alert(val);          
        }).catch(err => {
          Logger.get("dev").error(err.message, err);
        });
        subscription.unsubscribe();
    });
  }

  generateNotification() {
    this.notifications.notify("Notification at " + Date.now(), true);
  }

  humanReadableCron(): string {
    try {
      return cronstrue.toString(this.cronInput);
    } catch (err) {
      return err;
    }
  }
}
