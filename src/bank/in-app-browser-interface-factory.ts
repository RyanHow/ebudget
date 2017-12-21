import { Injectable } from "@angular/core";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { InAppBrowserInterface } from "./in-app-browser-interface";
import { Logger } from "../services/logger";
import { Notifications } from "../services/notifications";

@Injectable()
export class InAppBrowserInterfaceFactory {
    constructor(private inAppBrowser: InAppBrowser, private notifications: Notifications) {

    }

    public async createBrowser(logger: Logger, backgroundMode: boolean): Promise<InAppBrowserInterface> {
        let browserObject = this.inAppBrowser.create('about:blank', '_blank', {hidden: 'yes', hardwareback: 'no', zoom: 'no', location: 'yes'});
        let inAppBrowserInterface = new InAppBrowserInterface(browserObject, logger, this.notifications, backgroundMode);
        await inAppBrowserInterface.onLoadStop();
        return inAppBrowserInterface;
    }
    
}