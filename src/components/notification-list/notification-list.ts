import {Component, Input} from '@angular/core';
import {Notifications, Notification} from '../../services/notifications'
import { NavController } from "ionic-angular";

@Component({
  selector: 'notification-list',
  templateUrl: 'notification-list.html'
})

export class NotificationList {
 
  @Input()
  limit: number = Number.MAX_SAFE_INTEGER;

  @Input()
  new: boolean;

  @Input()
  nav: NavController;

  notifications: Array<Notification>;

  constructor(public notificationService: Notifications) {
    
  }

  ngOnInit() {
    this.notifications = this.new ? this.notificationService.newNotifications : this.notificationService.notifications;
  }

  notificationClicked(notification: Notification) {
    if (notification.clickAction) {
      if (notification.clickAction.type === 'custom') {
        notification.clickAction.data();
      } else if (notification.clickAction.type === 'page-nav') {
        this.nav.push(notification.clickAction.data.page, notification.clickAction.data.params);
      }
    }
  }


}