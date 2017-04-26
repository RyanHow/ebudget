import {Injectable} from '@angular/core';
import {HostInterface} from './host-interface';
import {InAppBrowser, InAppBrowserObject} from '@ionic-native/in-app-browser';

@Injectable()
export class StandardHostInterface implements HostInterface {

    browser: InAppBrowserObject;
    forceShowBrowser: boolean;

    constructor(private inAppBrowser: InAppBrowser) {

    }

    manualShowBrowser() {
        this.forceShowBrowser = true;
        this.showBrowser();
    }

    showBrowser() {
        this.browser.show();
    }

    hideBrowser() {
        if (!this.forceShowBrowser) this.browser.hide();
    }

    prompt(){}
    notify(){}
    provideBrowser(url: string) : InAppBrowserObject {
        // TODO: Track these to make sure the provider has cleaned up when closed, or force close it...
        this.browser = this.inAppBrowser.create(url, '_blank', {hidden: 'yes', hardwareback: 'no', zoom: 'no', location: 'yes'});
        return this.browser;
        
    }

}