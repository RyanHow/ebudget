import {Component} from '@angular/core';
import {Notifications} from '../../services/notifications';

@Component({
  templateUrl: 'notifications.html'
})
export class NotificationsPage {

  markReadTimeout: number;
  
  constructor(private notifications: Notifications) {
  }
    

  ionViewDidEnter() {
    this.markReadTimeout = setTimeout(() => {
      this.notifications.markRead();
      this.markReadTimeout = 0;
    }, 3000);
  }

  ionViewDidLeave() {
    if (this.markReadTimeout) clearTimeout(this.markReadTimeout);
  }
    
}
