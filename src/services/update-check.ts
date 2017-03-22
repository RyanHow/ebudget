import {Injectable} from '@angular/core';
import {Notifications} from './notifications';
import {Configuration} from './configuration-service';
import {AppReady} from '../app/app-ready';
import {Logger} from './logger';

@Injectable()
export class UpdateCheck {
    
    private logger: Logger = Logger.get('Notifications');

    constructor(appReady: AppReady, notifications: Notifications, configuration: Configuration) {
        appReady.ready.then(() => {
            if ((<any>window).serviceWorkerUpdateAvailable) {
                let message = "An update has been downloaded and will be installed next time the app is opened.";
                this.logger.info(message);
                notifications.notify(message, true);
            }
        });
    }
}