import {Injectable, ApplicationRef} from '@angular/core';
import {Notifications} from './notifications';
import {Configuration} from './configuration-service';
import {AppReady} from '../app/app-ready';
import {BuildInfo} from '../app/build-info';
import {Logger} from './logger';

@Injectable()
export class UpdateCheck {
    
    private logger: Logger = Logger.get('notifications');

    public serviceWorkerUpdateAvailable: boolean;
    public serviceWorkerUpdateNotified: boolean;
    public serviceWorkerVersion: string;
    public updatedServiceWorkerVersion: string;
    public serviceWorkerUnregistered: boolean = false;

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

            
            this.serviceWorkerVersion = (<any>window).activeServiceWorkerVersion;
            this.checkServiceWorkerVersionMismatch();
            window.addEventListener('activeserviceworkerversionreported', (ev) => {
                this.serviceWorkerVersion = (<any>window).activeServiceWorkerVersion;
                this.checkServiceWorkerVersionMismatch();
                applicationRef.tick();
            });

            this.checkAndNotifyServiceWorkerUpdate();
            window.addEventListener('updatedserviceworkerversionreported', (ev) => {
                this.checkAndNotifyServiceWorkerUpdate();
                applicationRef.tick();
            });

            window.addEventListener('serviceworkerinstalled', (ev) => {
                let message = "Offline support has been installed. You can now use the app offline.";
                this.logger.info(message);
                this.notifications.notify(message, true);
                applicationRef.tick();
            });


            this.triggerServiceWorkerUpdateCheck();


        });
    }

    checkServiceWorkerVersionMismatch() {
        if (this.serviceWorkerVersion && this.serviceWorkerVersion !== BuildInfo.version) {
            this.logger.info("Service worker version (" + this.serviceWorkerVersion + ") <-> app version (" + BuildInfo.version + ") mismatach. Unregistering service worker.");
            this.unregisterServiceWorker();
        }
    }

    isServiceWorkerAvailable(): boolean {
        return !this.serviceWorkerUnregistered && (<any>window).serviceWorkerUpdateCheckFunction;
    }

    triggerServiceWorkerUpdateCheck() {
        if (this.serviceWorkerUpdateAvailable) return;

        if ((<any>window).serviceWorkerUpdateCheckFunction) {
            (<any>window).serviceWorkerUpdateCheckFunction();
        }
    }

    checkAndNotifyServiceWorkerUpdate(): boolean {
        if (this.serviceWorkerUpdateNotified) return true;

        if ((<any>window).serviceWorkerUpdateAvailable) {
            this.serviceWorkerUpdateAvailable = true;
        }

        if ((<any>window).updatedServiceWorkerVersion) {
            this.updatedServiceWorkerVersion = (<any>window).updatedServiceWorkerVersion;
            let message = "An update has been downloaded (" + this.updatedServiceWorkerVersion + ") and will be installed next time the app is opened.";
            this.logger.info(message);
            this.notifications.notify(message, true);
            this.serviceWorkerUpdateNotified = true;
            return true;
        }

        return false;
    }

    unregisterServiceWorker(): Promise<boolean> {
        if ((<any>window).serviceWorkerUnregisterFunction) {
            return (<Promise<boolean>> ((<any>window).serviceWorkerUnregisterFunction())).then((result) => {
                if (result) {
                    let message = "Offline support has been removed. It will be re-enabled after the app has been restarted.";
                    this.serviceWorkerUnregistered = true;
                    this.logger.info(message);
                    this.notifications.notify(message, true);
                }
            });
        }
        return Promise.resolve(false);
    }
}