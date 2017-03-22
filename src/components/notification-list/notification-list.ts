import {Component, Input} from '@angular/core';
import {Notifications, Notification} from '../../services/notifications'

@Component({
  selector: 'notification-list',
  templateUrl: 'notification-list.html'
})

export class NotificationList {
 
  @Input()
  limit: number = Number.MAX_SAFE_INTEGER;

  @Input()
  new: boolean;

  constructor(public notificationService: Notifications) {
    
  }

  get notifications(): Array<Notification> {
    return this.new ? this.notificationService.newNotifications : this.notificationService.notifications;
  }

}