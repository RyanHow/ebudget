import {Component} from '@angular/core';
import {Notifications} from '../../services/notifications'

@Component({
  selector: 'main-menu-icon',
  templateUrl: 'main-menu-icon.html'
})

export class MainMenuIcon {
 
  constructor(public notifications: Notifications) {
  }

}