import {Component, Input} from '@angular/core';
import {Notifications, Notification} from '../../services/notifications'

@Component({
  selector: 'status',
  templateUrl: 'status.html'
})

export class Status {
 
  @Input()
  header: HTMLElement

  constructor(public notificationService: Notifications) {
    
  }


}