import { Injectable, NgZone } from "@angular/core";
import { Utils } from "../services/utils";
import { DemoBuilder } from "./demo-builder";
import { DemoRunner } from "./demo-runner";

declare var ebudget;

@Injectable()
export class DemoService {
    demoRunner: DemoRunner;
    demoBuilder: DemoBuilder;

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

        this.demoBuilder = new DemoBuilder();
        this.demoRunner = new DemoRunner();

    }

    receiveMessage(event: MessageEvent) {
        if (this.controlUrls.indexOf(event.origin) >= 0) {
            if (event.data.demo && event.data.demo.command === 'script') {
                let o = JSON.parse(event.data.demo.script);
                this.demoBuilder.buildFrom(o);
                this.demoBuilder.run(this.demoRunner);
            } else if (event.data.demo && event.data.demo.command === 'reset') {
                alert('TODO');
            } else {
                alert('invalid message' + JSON.stringify(event.data));
            }

        }
    }
}