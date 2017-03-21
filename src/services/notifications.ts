import {Injectable} from '@angular/core';
import {ToastController} from 'ionic-angular';
import {Logger} from './logger';

@Injectable()
export class Notifications {
    
    private logger: Logger = Logger.get('Notifications');

    acknowledged: boolean;

    constructor(private toastController: ToastController) {

    }

    notify(message: string, popup?: boolean) {
        this.acknowledged = false;

        this.logger.debug("Notification: " + message);

        if (popup) {
            this.toastController.create({message: "TODO"}).present();
        }
        // TODO..
    }
}