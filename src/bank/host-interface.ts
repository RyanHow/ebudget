import {InAppBrowserObject} from '@ionic-native/in-app-browser';

export interface HostInterface {
    requestInteraction();
    prompt();
    notify();
    provideBrowser(url: string) : InAppBrowserObject
}