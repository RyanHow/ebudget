import {Component} from '@angular/core';
import {Replication} from '../services/replication-service';
import {ActionSheetController} from 'ionic-angular';
import {LoggerUINotifierAppender} from '../services/logger-ui-notifier-appender';

@Component({
  selector: 'replication-error',
  template: '<div *ngIf="!hide" (click)="click()" [class.show]="!replication.syncing.lastResultSuccess" [class.error]="replication.syncing.consecutiveErrorCount>2">{{replicationStatus()}}</div>'
})

export class ReplicationErrorDisplay {

  public hide: boolean = false;

  constructor(public replication: Replication, public actionSheetCtrl: ActionSheetController) {
  }

  replicationStatus(): string {
    if (this.replication.syncing.lastResultSuccess) return 'Synchronised';
    return 'Synchronise Error';
  }

  click() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Sync Error',
      buttons: [
        {
          text: 'Hide Sync Error Messages',
          handler: () => {
            this.hide = true;
          }
        }, {
          text: 'Send Error Report',
          handler: () => {
            LoggerUINotifierAppender.instance.handler.handle('Sync Error');
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