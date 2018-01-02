import {Injectable} from '@angular/core';
import {ToastController, Toast} from 'ionic-angular';
import {Logger} from './logger';
import {CurrencyFormatter} from './currency-formatter';

export class Notification {
    message: string;
    important?: boolean
    category?: string;
    popup?: boolean;
    silent?: boolean;

    budgetId?: string;

    popupDone?: boolean;
    read?: boolean;
    acknowledged?: boolean;

    clickAction?: {type: 'custom'; action: any};
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
        if (!number) {
            this.newNotifications.length = 0;
        } else {
            this.newNotifications.splice(0, number);
            this.newNotifications.forEach(n => {
                n.acknowledged = true;
            });
        }
        this.updateImportantFlag();
        this.updateAcknowledgedFlag();
    }

    markRead(number : number = Number.MAX_SAFE_INTEGER) {
        let count = 0;
        this.notifications.some((n) => {
            n.read = true;
            n.acknowledged = true;
            return ++count >= number;
        })
        this.updateImportantFlag();
        this.updateAcknowledgedFlag();
    }


    show(notification: Notification) {

        if (notification.popup === undefined) notification.popup = true;

        notification.acknowledged = notification.silent;
        
        this.logger.debug("Notification: " + notification.message);

        this.notifications.unshift(notification);

        if (!notification.important) {
            let index = this.newNotifications.findIndex(n => !n.important);
            if (index != -1) {
                this.newNotifications.splice(index, 0, notification);
            } else {
                this.newNotifications.unshift(notification);
            }
        } else {
            this.newNotifications.unshift(notification);
        }

        this.runPopupQueue();

        this.updateImportantFlag();
        this.updateAcknowledgedFlag();

    }

    remove(criteria: {category: string}) {
        // TODO: Remove and update status, etc
        let index = this.newNotifications.findIndex(n => n.category === criteria.category);
        if (index != -1) this.newNotifications.splice(index, 1);
        let index2 = this.notifications.findIndex(n => n.category === criteria.category);
        if (index2 != -1) this.notifications.splice(index2, 1);
        

        this.updateImportantFlag();
        this.updateAcknowledgedFlag();
    }

    runPopupQueue() {

        // TODO: Combine popups for a group and put a delay on running the queue (to allow any processes to generate multiple notifications that can be combined)

        if (this.currentToast) return;

        this.notifications.some((notification) => {
            if (notification.popup && !notification.popupDone) {
                this.currentToast = this.toastController.create({message: (notification.important ? ' ! ' : '') + notification.message, duration: 5000, showCloseButton: true, closeButtonText: 'X'});

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

    updateAcknowledgedFlag() {
        this.acknowledged = true;
        this.newNotifications.some((n) => {
            this.acknowledged = n.acknowledged;
            return !n.acknowledged;
        });
    }


    updateImportantFlag() {
        this.important = false;
        this.newNotifications.some((n) => {
            this.important = n.important && !n.acknowledged;
            return n.important;
        });
    }
}