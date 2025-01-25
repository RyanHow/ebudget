import {Injectable, ApplicationRef} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Notifications} from './notifications';
import {Configuration} from './configuration-service';
import {AppReady} from '../app/app-ready';
import {BuildInfo} from '../app/build-info';
import {Logger} from './logger';
import { Utils } from "./utils";

@Injectable()
export class UpdateCheck {

    private logger: Logger = Logger.get('notifications');

    public serviceWorkerUpdateAvailable: boolean;
    public serviceWorkerUpdateNotified: boolean;
    public serviceWorkerVersion: string;
    public updatedServiceWorkerVersion: string;
    public serviceWorkerUnregistered: boolean = false;
    public webUpdateAvailable: boolean;
    public webVersion: string;

    constructor(appReady: AppReady, private notifications: Notifications, private configuration: Configuration, private applicationRef: ApplicationRef, private http: Http) {

        if (Utils.getQueryStringValue('demo')) return; // Skip this for demos

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

                this.initWebUpdateAutoCheck();

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
                this.notifications.show({message: message, popup: true, silent: true, category: 'update-check'});
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
            this.notifications.show({message: message, popup: true, silent: true, category: 'update-check'});
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
                    this.notifications.show({message: message, popup: true, silent: true, category: 'update-check'});
                }
                return result;
            });
        }
        return Promise.resolve(false);
    }

    initWebUpdateAutoCheck() {
        setTimeout(() => {
            if (this.webUpdateAvailable) return;
            this.runWebUpdateCheck();
            this.initWebUpdateAutoCheck();
        }, 1000 * 60 * 60 /*1 Hour*/);

        this.runWebUpdateCheck();

    }

    runWebUpdateCheck(): Observable<Response> {
        let observable = this.http.get('https://ebudget.bitworks.com.au/info.json?cachebust=' + new Date().getTime());

        observable.map(res => res.json())
        .subscribe((response) => {
            try {
                if (BuildInfo.version !== response.version) {
                    this.webVersion = response.version;
                    this.webUpdateAvailable = true;
                    this.logger.info("Web update is available. Version: " + this.webVersion);
                    if (!this.isServiceWorkerAvailable() && !this.configuration.native) {
                        let message = "An update is available (" + this.webVersion + "). Refresh to update.";
                        this.logger.info(message);
                        this.notifications.show({message: message, popup: true, silent: true, category: 'update-check'});
                    }
                }
            } catch (err) {
                this.logger.info("Error in response data from web update check", response, err);
            }
        }, (error) => {
            this.logger.info("Error during web update check", error);
        });

        return observable;
    }
}
