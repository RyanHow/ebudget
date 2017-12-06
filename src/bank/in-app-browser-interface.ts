import { BrowserInterface } from "./browser-interface";
import { InAppBrowserObject } from "@ionic-native/in-app-browser";
import { Logger } from "../services/logger";

export class InAppBrowserInterface extends BrowserInterface {
    loading: boolean;
    logger: Logger;

    updateVisbility() {
        if (this.visible()) {
            this.logger.debug("Browser visible");
            this.inAppBrowserObject.show();
        } else {
            this.logger.debug("Browser hidden");
            this.inAppBrowserObject.hide();
        }
    }

    onLoadStop(): Promise<void> {
        return new Promise<void>(resolve => {
            let subscription = this.inAppBrowserObject.on('loadstop').subscribe(ev => {
                subscription.unsubscribe();
                resolve();
            });
        });        
    }

    onLoadStart(): Promise<void> {
        return new Promise<void>(resolve => {
            let subscription = this.inAppBrowserObject.on('loadstart').subscribe(ev => {
                subscription.unsubscribe();
                resolve();
            });
        });        
    }
    onClose(): Promise<void> {
        return new Promise<void>(resolve => {
            let subscription = this.inAppBrowserObject.on('exit').subscribe(ev => {
                subscription.unsubscribe();
                resolve();
            });
        });        
    }
    onLoadError(): Promise<any> {
        return new Promise<any>(resolve => {
            let subscription = this.inAppBrowserObject.on('loaderror').subscribe(ev => {
                subscription.unsubscribe();
                resolve(ev.message);
            });
        });        
    }

    isLoading() {
        return this.loading;
    }

    constructor(private inAppBrowserObject: InAppBrowserObject, logger: Logger) {
        super();
        this.logger = logger;
        inAppBrowserObject.on('loadstart').subscribe(ev => {
            this.loading = true;
            this.logger.debug("Browser Load Start");
        });
        inAppBrowserObject.on('loadstop').subscribe(ev => {
            this.loading = false;
            this.logger.debug("Browser Load Stop");
        });
        
        
    }

    execute(script: string): Promise<any> {
        let wrappedCode = "try {" + script + "}catch(err){'Error: ' + JSON.stringify(err)}";
        return this.inAppBrowserObject.executeScript({code: wrappedCode}).then((result) => {
            if ((<string> result[0] + '').startsWith('Error: ')) {
                this.logger.info('Error in executed script', script, result[0]);
                return null;
            }
            return result[0];
        }).catch(reason => {
            this.logger.info('Error executing script in browser', script, reason);            
        });

    }

    close() {
        this.inAppBrowserObject.close();
        this.logger.debug("Closed");
    }

    

}