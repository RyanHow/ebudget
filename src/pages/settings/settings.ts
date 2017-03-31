import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Configuration} from '../../services/configuration-service';

@Component({
  templateUrl: 'settings.html'
})
export class SettingsPage {
  
  constructor(private nav: NavController, private configuration: Configuration) {
  }
  
  set experimentalTransactionNotifications(value: boolean) {
    this.configuration.optionBoolean('experimental.transaction.notifications', value);
  }
    
  get experimentalTransactionNotifications(): boolean {
    return this.configuration.optionBoolean('experimental.transaction.notifications');
  }

}
