import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Dbms} from '../../db/dbms';
import {Logger} from '../../services/logger';
import {Configuration} from '../../services/configuration-service';
import {Notifications} from '../../services/notifications';
import {LoggerUINotifierAppender} from '../../services/logger-ui-notifier-appender';
import {InAppBrowser} from '@ionic-native/in-app-browser';
import cronstrue from 'cronstrue';
import { DemoUI } from "../../demo/demo-ui";
import { DemoPlayer } from "../../demo/demo-player";
import { Utils } from "../../services/utils";

@Component({
  templateUrl: 'dev.html'
})
export class DevPage {
  randomFooterId: string;

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
  
  constructor(private nav: NavController, private dbms: Dbms, public configuration: Configuration, private notifications: Notifications, private inAppBrowser: InAppBrowser) {
    
  }
    
  toUpper3(nv: string) {
    this.testamount3 = nv.toUpperCase();
  }

  ionViewDidEnter() {
    this.randomFooterId = 'footer_' + Utils.randomChars(10);
    let div = document.createElement('div');
    div.innerHTML = '<div id="' + this.randomFooterId + '" style="position:fixed; height:100px; z-index:100; background-color:gainsboro; left:0; right:0; bottom:0"><button ion-button small (mousedown)="$event.preventDefault();" (touchtap)="$event.preventDefault();" (click)="testClick()">Test Button :)</button></div>';
    document.querySelector('.app-root').appendChild(div.firstChild);
  }

  ionViewWillLeave() {
    document.getElementById(this.randomFooterId).remove();
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
    let browser = this.inAppBrowser.create('https://www.google.com', '_blank');
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
    this.notifications.show({message: "Notification at " + Date.now()});
  }

  generateImportantNotification() {
    this.notifications.show({message: "Notification at " + Date.now(), important: true, clickAction: {type: 'custom', action: () => alert('click!')}, category: 'dev.important'});
  }

  removeImportantNotification() {
    this.notifications.remove({category: 'dev.important'});    
  }


  testClick() {
    window.alert(':P');
  }

  humanReadableCron(): string {
    try {
      return cronstrue.toString(this.cronInput);
    } catch (err) {
      return err;
    }
  }

  demoTest() {
    let demo = new DemoUI();
    setTimeout(() => demo.moveTo('#dev-cron-input'), 1000);

  }

  demoTest2() {
    let demoRunner = new DemoUI();
    let demo = new DemoPlayer(demoRunner, undefined);

    // TODO: Compress this (should just be able to call 'click' and it will do a move wait click to the location... Or call it iClick or something ?)

    demo.queue('move', '#dev-generate-notification');
    demo.queue('wait', 300);
    demo.queue('click', '#dev-generate-notification');
    demo.queue('wait', 2000);
    demo.queue('move', '#dev-cron-input');
    demo.queue('wait', 300);
    demo.queue('click', '#dev-cron-input');
    demo.queue('wait', 600);
    demo.queue('type', '#dev-cron-input', '0 * 5 * *');
    demo.queue('wait', 1600);

    demo.run();

  }
}
