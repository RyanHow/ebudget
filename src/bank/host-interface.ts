import {InAppBrowserObject} from '@ionic-native/in-app-browser';

export interface HostInterface {
    provideBrowser(url: string) : InAppBrowserObject
    showBrowser();
    hideBrowser();
    prompt();
    notify();
}