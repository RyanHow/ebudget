import {Component, Input} from '@angular/core';
import {ActionSheetController} from 'ionic-angular';
import {LoggerUINotifierAppender} from '../services/logger-ui-notifier-appender';

@Component({
  selector: 'error-label',
  template: '<div (click)="click()">{{message}}</div>'
})

export class ErrorLabel {

  public hide: boolean = false;

  @Input()
  public message;

  constructor(public actionSheetCtrl: ActionSheetController) {
  }


  click() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Error',
      buttons: [
        {
          text: 'Send Error Report',
          handler: () => {
            LoggerUINotifierAppender.instance.handler.handle(this.message);
          }
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
          }
        }
      ]
    });
    actionSheet.present();

  }
}