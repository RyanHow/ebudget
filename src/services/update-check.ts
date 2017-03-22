import {Injectable, ApplicationRef} from '@angular/core';
import {Notifications} from './notifications';
import {Configuration} from './configuration-service';
import {AppReady} from '../app/app-ready';
import {Logger} from './logger';

@Injectable()
export class UpdateCheck {
    
    private logger: Logger = Logger.get('notifications');

    public serviceWorkerUpdateAvailable: boolean;

    constructor(appReady: AppReady, private notifications: Notifications, configuration: Configuration, private applicationRef: ApplicationRef) {
        appReady.ready.then(() => {
            setTimeout(() => {
                if (!this.checkAndNotifyServiceWorkerUpdate()) {

                    window.addEventListener('serviceworkerupdateavailable', (ev) => {
                        this.checkAndNotifyServiceWorkerUpdate();
                        applicationRef.tick();
                    });

                   this.triggerServiceWorkerUpdateCheck();
                   setInterval(() => this.triggerServiceWorkerUpdateCheck(), 1000 * 60 * 60 /*1 Hour*/);
                }
            }, 5000);

        });
    }

    isServiceWorkerAvailable(): boolean {
        return true && (<any>window).serviceWorkerUpdateCheckFunction;
    }

    triggerServiceWorkerUpdateCheck() {
        if (this.serviceWorkerUpdateAvailable) return;

        if ((<any>window).serviceWorkerUpdateCheckFunction) {
            (<any>window).serviceWorkerUpdateCheckFunction();
        }
    }

    checkAndNotifyServiceWorkerUpdate(): boolean {
        if (this.serviceWorkerUpdateAvailable) return true;

        if ((<any>window).serviceWorkerUpdateAvailable) {
            let message = "An update has been downloaded and will be installed next time the app is opened.";
            this.logger.info(message);
            this.notifications.notify(message, true);
            this.serviceWorkerUpdateAvailable = true;
            return true;
        }

        return false;
    }
}