import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Configuration} from '../../services/configuration-service';

@Component({
  templateUrl: 'settings.html'
})
export class SettingsPage {
  
  constructor(private nav: NavController, private configuration: Configuration) {
  }
  
    
}
