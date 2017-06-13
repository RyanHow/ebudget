import { Injectable, NgZone } from "@angular/core";
import { Utils } from "../services/utils";

declare var ebudget;

@Injectable()
export class DemoService {

    private controlUrls = ['http://localhost:8100', 'https://ebudgetapp.com'];

    constructor(zone: NgZone) {
        if (typeof (<any>window).ebudget === 'undefined') (<any>window).ebudget = {};
    }

    start() {

        ebudget.demo = {};

        window.addEventListener('message', this.receiveMessage.bind(this), false);

        if (window.parent && Utils.getQueryStringValue('demo_control_url')) {
            window.parent.postMessage({event: 'ready', id: Utils.getQueryStringValue('demo')}, decodeURI(Utils.getQueryStringValue('demo_control_url'))); // TODO: How to get this source ? maybe from demo query string?
        }
    }

    receiveMessage(event: MessageEvent) {
        if (this.controlUrls.indexOf(event.origin) >= 0) {
            alert(event.data); // Contains a demo script to run and start data ? .. How to get a demo with a calling page ? - Need a localhost page set up with some links to control it....

        }
    }
}