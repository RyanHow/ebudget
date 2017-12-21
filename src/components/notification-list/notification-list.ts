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

  notifications: Array<Notification>;

  constructor(public notificationService: Notifications) {
    
  }

  ngOnInit() {
    this.notifications = this.new ? this.notificationService.newNotifications : this.notificationService.notifications;
  }

  notificationClicked(notification: Notification) {
    if (notification.clickAction) {
      if (notification.clickAction.type === 'custom') {
        notification.clickAction.action();
      }
    }
  }


}