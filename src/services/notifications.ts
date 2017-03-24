import {Injectable} from '@angular/core';
import {ToastController, Toast} from 'ionic-angular';
import {Logger} from './logger';

export class Notification {
    message: string;
    read?: boolean;
    popup?: boolean;
    popupDone?: boolean;
}

@Injectable()
export class Notifications {
    
    private logger: Logger = Logger.get('Notifications');

    acknowledged: boolean = true;
    notifications: Array<Notification> = [];
    newNotifications: Array<Notification> = [];
    currentToast: Toast;

    constructor(private toastController: ToastController) {

    }

    clear(number? : number) {
        this.acknowledged = true;
        if (!number) this.newNotifications.length = 0;
        else this.newNotifications.splice(0, number);
    }

    markRead(number : number = Number.MAX_SAFE_INTEGER) {
        this.acknowledged = true;
        let count = 0;
        this.notifications.some((n) => {
            n.read = true;
            return ++count >= number;
        })
    }

    notify(message: string, popup?: boolean) {
        this.acknowledged = false;

        this.logger.debug("Notification: " + message);
        let notification = {message: message, popup: popup};
        this.notifications.unshift(notification);
        this.newNotifications.unshift(notification);

        this.runPopupQueue();
    }

    runPopupQueue() {
        if (this.currentToast) return;

        this.notifications.some((notification) => {
            if (notification.popup && !notification.popupDone) {
                this.currentToast = this.toastController.create({message: notification.message, duration: 5000, showCloseButton: true, closeButtonText: 'X'});

                this.currentToast.onDidDismiss(() => {
                    this.currentToast = null;
                    this.runPopupQueue();
                });

                this.currentToast.present();
                notification.popupDone = true;
                return true;
            }

            return false;
       });

    }
}