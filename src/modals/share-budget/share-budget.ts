import {NavParams, ViewController, NavController, ActionSheetController, ToastController} from 'ionic-angular';
import {Clipboard as NativeClipboard} from 'ionic-native';
import {FormBuilder, Validators, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs/Subscription';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import {Dbms} from '../../db/dbms';
import {Db} from '../../db/db';
import {Configuration} from '../../services/configuration-service';
import {Replication} from '../../services/replication-service';
import {Component} from '@angular/core';
import {Logger} from '../../services/logger';
import Clipboard from 'clipboard';

@Component({
  templateUrl: 'share-budget.html'
})
export class ShareBudgetModal {

  private logger: Logger = Logger.get('ShareBudgetModal');

  form: FormGroup;
  budget: Db;
  linkBudgetId: string;
  newlyLinkedBudget: boolean;
  linking: boolean;
  linkingSubscription: Subscription;
  sharing: boolean;
  sharingSubscription: Subscription;
  linkingError: boolean;
  linkingErrorMessage: string;
  sharingError: boolean;
  sharingErrorMessage: string;
  closed: boolean;
  
  constructor(public viewCtrl: ViewController, private formBuilder: FormBuilder, private http: Http, navParams: NavParams, private dbms: Dbms, private configuration: Configuration, private replication: Replication, private nav: NavController, private actionSheetCtrl: ActionSheetController, private toastCtrl: ToastController) {
    this.viewCtrl = viewCtrl;
    this.form = formBuilder.group({
      budgetName: ['', Validators.required]
    });

    if (navParams.data.budgetId) {
      this.budget = dbms.getDb(navParams.data.budgetId);
      
    }
    
  }
    
  close() {
    if (this.closed) return;
    this.closed = true;

    if (this.newlyLinkedBudget) {
      this.viewCtrl.dismiss({'newBudget' : this.budget});
    } else {
      this.viewCtrl.dismiss();
    }
  }

  cancel() {
    if (this.newlyLinkedBudget) return;
    if (this.linkingSubscription && !this.linkingSubscription.closed) {
      this.linkingSubscription.unsubscribe();
      delete this.linkingSubscription;
    }
    this.linking = false;
    if (this.sharingSubscription && !this.sharingSubscription.closed) {
      this.sharingSubscription.unsubscribe();
      delete this.sharingSubscription;
    }
    this.sharing = false;
  }
  
  isShared(): boolean {
    return this.budget && this.replication.enabled(this.budget);
  }
  
  tryLink(budgetId: string) {
    this.linkingError = false;
    this.doLink(budgetId, err => {
      }, budget => {
        setTimeout(() => this.close(), 3000);
      });
  }

  doLink(budgetId: string, errorHandler?: any, successHandler?: any) {
    if (this.newlyLinkedBudget) return;

    if (this.linkingSubscription && !this.linkingSubscription.closed) this.linkingSubscription.unsubscribe();
      
    this.linkingSubscription = this.http.post('https://api.freebudgetapp.com/link', JSON.stringify({ 'dbId': budgetId, 'deviceId': this.configuration.deviceInstallationId, 'deviceName': this.configuration.deviceName }))
      .map(response => response.json())
      .subscribe(response => {

        this.logger.info('success: ' + JSON.stringify(response));
        var budgetName = response.dbName;
        var deviceReplId = response.replId;

        this.dbms.createDb(budgetId).then(budget => {
          this.budget = budget;
          this.budget.name(budgetName);
          
          this.replication.enable(this.budget, deviceReplId);
          this.replication.safeSync();

          this.newlyLinkedBudget = true;
        }).then(() => {
          if (successHandler) successHandler(this.budget);
        });
      }, err => {
        this.logger.debug('error: ' + JSON.stringify(err));
        if (errorHandler) errorHandler(err);
      });
  }

  link(budgetId: string) {
    this.linking = true;
    this.linkingError = false;
    this.doLink(budgetId, err => {
        this.linking = false;
        this.linkingError = true;
        try {
          let message = JSON.parse(err._body).error.message + '';
          if (message.match('Bad Request: Invalid dbId ')) {
            message = message.replace('Bad Request: Invalid dbId ', '');
            this.linkingErrorMessage = 'The share code ' + message + ' doesn\'t link up with any budget that we know about. Please check it and try again.';
          } else if (message.match('Bad Request: dbId ') && message.match(' does not exist')) {
            message = message.replace('Bad Request: dbId ', '').replace(' does not exist', '');
            this.linkingErrorMessage = 'The share code ' + message + ' doesn\'t link up with any budget that we know about. Please check it and try again.';
          } else if (message) {
            this.linkingErrorMessage = 'Error: ' + message;
          }
          
        } catch (e) {
          this.linkingErrorMessage = err && err.status ? 'Error Code: ' + err.status + ' - ' + err.statusText : 'Uh Oh! Something has gone wrong. Please try again.';
        }
      }, budget => {
        this.linking = false;
        setTimeout(() => this.close(), 3000);
      });
  }
  
  shareBudget() {

    if (this.sharingSubscription && !this.sharingSubscription.closed) this.sharingSubscription.unsubscribe();

    this.sharing = true;
    this.sharingError = false;
    this.sharingSubscription = this.http.post('https://api.freebudgetapp.com/share', JSON.stringify({'dbId': this.budget.id, 'dbName': this.budget.name(), 'deviceId': this.configuration.deviceInstallationId, 'deviceName': this.configuration.deviceName}))
      .map(response => response.json())
      .subscribe(response => {
            this.logger.info('success: ' + JSON.stringify(response));
            this.replication.enable(this.budget, response.replId);
            this.logger.info('ReplId: ' + this.replication.enabled(this.budget));
            this.sharing = false;
      }, err => {
            this.logger.debug('error: ' + JSON.stringify(err));
            this.sharing = false;
            this.sharingError = true;
            try {
              let message = JSON.parse(err._body).error.message + '';
              this.sharingErrorMessage = 'Error: ' + message;
            } catch (e) {
              this.sharingErrorMessage = err && err.status ? 'Error Code: ' + err.status + ' - ' + err.statusText : 'Uh Oh! Something has gone wrong. Please try again.';
            }
      });

  }
  
  shareOptions() {
   let actionSheet = this.actionSheetCtrl.create({
      title: 'Share',
      buttons: [
        {
          text: 'Email',
          handler: () => {
            window.location.href = 'mailto:?subject=' + encodeURI(this.budget.name()) + ' Share Code&body=' + encodeURI(this.budget.id);
          }
        }, {
          text: 'Copy',
          cssClass: 'share-copy',
          handler: () => {
            if (this.configuration.native) {
              NativeClipboard.copy(this.budget.id).then(() => {
                this.toastCtrl.create({
                      message: 'Copied!\nOpen another application and paste the share code',
                      duration: 10000,
                      showCloseButton: true,
                      position: 'bottom'
                    }).present();
                }, reason => {
                this.toastCtrl.create({
                      message: 'Uh oh!\nThe code couldn\'t be copied (' + reason + '). You\'ll need to highlight the code and press Ctrl-C to copy.',
                      duration: 10000,
                      showCloseButton: true,
                      position: 'bottom'
                    }).present();
              });

            }
          }
        }, {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    actionSheet.present().then(() => {

      if (!this.configuration.native) {
          let cb = new Clipboard('.share-copy', {text: () => this.budget.id });
          cb.on('success', () => {
            this.toastCtrl.create({
                  message: 'Copied!\nOpen another application and paste the share code',
                  duration: 10000,
                  showCloseButton: true,
                  position: 'bottom'
                }).present();
          });
          cb.on('error', () => {
            this.toastCtrl.create({
                  message: 'Uh oh!\nThe code couldn\'t be copied. You\'ll need to highlight the code and press Ctrl-C to copy.',
                  duration: 10000,
                  showCloseButton: true,
                  position: 'bottom'
                }).present();
          });
        }
      });
  }

} 