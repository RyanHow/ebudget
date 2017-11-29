import { BrowserInterface } from "./browser-interface";
import { InAppBrowserObject } from "@ionic-native/in-app-browser";

export class InAppBrowserInterface implements BrowserInterface {

    constructor(private inAppBrowserObject: InAppBrowserObject) {
        
    }

    dispose() {
        this.inAppBrowserObject.close();
    }

}