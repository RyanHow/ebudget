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

    private controlUrls = ['https://ebudgetapp.com'];

    constructor(zone: NgZone, private demoSetup: DemoSetup, private autofocus: Autofocus) {
        if (typeof (<any>window).ebudget === 'undefined') (<any>window).ebudget = {};
    }

    start() {

        ebudget.demo = {};

        window.addEventListener('message', this.receiveMessage.bind(this), false);

        if (window.parent && Utils.getQueryStringValue('demo_control_url')) {
            window.parent.postMessage({event: 'ready', id: Utils.getQueryStringValue('demo')}, decodeURI(Utils.getQueryStringValue('demo_control_url'))); // TODO: How to get this source ? maybe from demo query string?
        }

        this.demoUI = new DemoUI();
        this.demoUI.focusEnabled = this.autofocus.enabled && true;
        this.demoPlayer = new DemoPlayer(this.demoUI, this.demoSetup);
        
        this.demoPlayer.onStateChange(state => {
            window.parent.postMessage({event: 'state-change', id: Utils.getQueryStringValue('demo'), state: state}, decodeURI(Utils.getQueryStringValue('demo_control_url'))); // TODO: How to get this source ? maybe from demo query string?            
        })
    }

    receiveMessage(event: MessageEvent) {
        if (event.origin.startsWith('http://localhost:') || this.controlUrls.indexOf(event.origin) >= 0) {
            if (event.data.demo && event.data.demo.command === 'script') {
                let o = typeof event.data.demo.script == 'string' ? JSON.parse(event.data.demo.script) : event.data.demo.script;
                this.demoPlayer.buildFrom(o);
                this.demoPlayer.setup().then(() => {
                    if (o.autoplay) this.demoPlayer.run();
                });
            } else if (event.data.demo && event.data.demo.command === 'stop') {
                this.demoPlayer.stop();
            } else if (event.data.demo && event.data.demo.command === 'pause') {
                this.demoPlayer.pause();
            } else if (event.data.demo && event.data.demo.command === 'reset') {
                this.demoPlayer.reset();
            } else if (event.data.demo && event.data.demo.command === 'run') {
                this.demoPlayer.run();
            } else if (event.data.demo && event.data.demo.command === 'clear') {
                this.demoPlayer.clear();
            } else {
                alert('invalid message' + JSON.stringify(event.data));
            }

        }
    }
}