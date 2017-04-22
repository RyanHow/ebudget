import {Injectable} from '@angular/core';
import {HostInterface} from './host-interface';
import {InAppBrowser, InAppBrowserObject} from '@ionic-native/in-app-browser';

@Injectable()
export class StandardHostInterface implements HostInterface {

    constructor(private inAppBrowser: InAppBrowser) {

    }

    requestInteraction(){}
    prompt(){}
    notify(){}
    provideBrowser(url: string) : InAppBrowserObject {
        // TODO: Track these to make sure the provider has cleaned up when closed, or force close it...
        return this.inAppBrowser.create(url, '_blank');
        
    }

}