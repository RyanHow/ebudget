import { Injectable } from "@angular/core";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { InAppBrowserInterface } from "./in-app-browser-interface";
import { Logger } from "../services/logger";

@Injectable()
export class InAppBrowserInterfaceFactory {
    constructor(private inAppBrowser: InAppBrowser) {

    }

    public async createBrowser(logger: Logger): Promise<InAppBrowserInterface> {
        let browserObject = this.inAppBrowser.create('about:blank', '_blank', {hidden: 'yes', hardwareback: 'no', zoom: 'no', location: 'yes'});
        let inAppBrowserInterface = new InAppBrowserInterface(browserObject, logger);
        await inAppBrowserInterface.onLoadStop();
        return inAppBrowserInterface;
    }
    
}