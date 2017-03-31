import {Injectable} from '@angular/core';
import {ToastController, Toast} from 'ionic-angular';
import {Logger} from './logger';
import {CurrencyFormatter} from './currency-formatter';

export class Notification {
    message: string;
    important: boolean;
    read?: boolean;
    popup?: boolean;
    popupDone?: boolean;
}

@Injectable()
export class Notifications {
    
    private logger: Logger = Logger.get('Notifications');

    acknowledged: boolean = true;
    important: boolean = false;
    notifications: Array<Notification> = [];
    newNotifications: Array<Notification> = [];
    currentToast: Toast;

    constructor(private toastController: ToastController, private currencyFormatter: CurrencyFormatter) {

    }

    formatCurrency = (value: any): string => {
        return this.currencyFormatter.format(value);
    }

    clear(number? : number) {
        this.acknowledged = true;
        if (!number) this.newNotifications.length = 0;
        else this.newNotifications.splice(0, number);
        this.updateImportantFlag();
    }

    markRead(number : number = Number.MAX_SAFE_INTEGER) {
        this.acknowledged = true;
        let count = 0;
        this.notifications.some((n) => {
            n.read = true;
            return ++count >= number;
        })
        this.updateImportantFlag();
    }

    notify(message: string, popup?: boolean, silent: boolean = false, important: boolean = true) {
        this.acknowledged = this.acknowledged && silent;

        this.logger.debug("Notification: " + message);
        let notification = {message: message, popup: popup, important: important};
        this.notifications.unshift(notification);
        this.newNotifications.unshift(notification);

        this.runPopupQueue();

        this.updateImportantFlag();
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

    updateImportantFlag() {
        this.important = false;
        this.newNotifications.some((n) => {
            this.important = n.important;
            return n.important;
        });
    }
}