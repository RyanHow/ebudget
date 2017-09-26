import { Injectable, NgZone } from "@angular/core";
import { Utils } from "../services/utils";
import { DemoPlayer } from "./demo-player";
import { DemoUI } from "./demo-ui";
import { DemoSetup } from "./demo-setup";
import { Autofocus } from "../services/autofocus";

declare var ebudget;

@Injectable()
export class DemoService {
    demoUI: DemoUI;
    demoPlayer: DemoPlayer;

    private controlUrls = ['http://localhost:8100', 'https://ebudgetapp.com'];

    constructor(zone: NgZone, private demoSetup: DemoSetup, private autofocus: Autofocus) {
        if (typeof (<any>window).ebudget === 'undefined') (<any>window).ebudget = {};
    }

    start() {

        ebudget.demo = {};

        window.addEventListener('message', this.receiveMessage.bind(this), false);

        if (window.parent && Utils.getQueryStringValue('demo_control_url')) {
            window.parent.postMessage({event: 'ready', id: Utils.getQueryStringValue('demo')}, decodeURI(Utils.getQueryStringValue('demo_control_url'))); // TODO: How to get this source ? maybe from demo query string?
        }

        this.demoPlayer = new DemoPlayer();
        this.demoUI = new DemoUI();
        this.demoUI.focusEnabled = this.autofocus.enabled && true;

    }

    receiveMessage(event: MessageEvent) {
        if (this.controlUrls.indexOf(event.origin) >= 0) {
            if (event.data.demo && event.data.demo.command === 'script') {
                let o = JSON.parse(event.data.demo.script);
                this.demoPlayer.buildFrom(o);
                this.demoPlayer.setup(this.demoSetup).then(() => {
                    this.demoPlayer.run(this.demoUI);
                });
            } else if (event.data.demo && event.data.demo.command === 'reset') {
                this.demoSetup.reset();
            } else {
                alert('invalid message' + JSON.stringify(event.data));
            }

        }
    }
}