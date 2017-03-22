import {Injectable} from '@angular/core';
import {ToastController} from 'ionic-angular';
import {Logger} from './logger';

export class Notification {
    message: string;
    read?: boolean;
}

@Injectable()
export class Notifications {
    
    private logger: Logger = Logger.get('Notifications');

    acknowledged: boolean;
    notifications: Array<Notification> = [];
    newNotifications: Array<Notification> = [];

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
        let notification = {message: message};
        this.notifications.unshift(notification);
        this.newNotifications.unshift(notification);

        if (popup) {
            this.toastController.create({message: message, duration: 3000, showCloseButton: true, closeButtonText: 'X'}).present();
        }

    }
}