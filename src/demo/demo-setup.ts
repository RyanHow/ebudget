import { Injectable } from "@angular/core";
import { App, NavController } from "ionic-angular";
import { BudgetPage } from "../pages/budget/budget";
import { DevPage } from "../pages/dev/dev";
import { HomePage } from "../pages/home/home";
import { Dbms } from "../db/dbms";

@Injectable()
export class DemoSetup {
    nav: NavController;

    script: Array<any>;
    currentLine: number;

    classMap = {
        budget: BudgetPage,
        dev: DevPage
    };

    constructor(private ionicApp: App, private dbms: Dbms) {
        
    }

    setup(script: Array<any>): Promise<void> {
        this.script = script;
        this.currentLine = 0;

        this.nav = this.ionicApp.getActiveNav();
        return this.executeScript();
    }

    // TODO: Add a command for database operations
    // TODO: Clear the demo database on reset
    // TODO: Demo-mode "hide" the app until the setup is complete (fade out and timer)... then unhide (fade in and timer)... Reset should be part of the "setup", so setup will reset first, then run the setup so reset and setup happen while faded - Maybe make reset and fade part of the setup commands? - or force have if manual intervention??...
    // TODO: Invoke demo automatically on load (setup and optionally start, this will be postmessage) AND have it faded out so we don't get a flash of the standard loading (this will be query param)
    // TODO: Demo Controls - pause/play, reset, auto loop, etc... (maybe autoloop should be a player setup param, NOT a queue command ?)
    // TODO: Input "Blocker" over it - not sure about keyboard focus... maybe block the entire iframe (so this could / would be outside of the app)
    // TODO: Some way to deny the focus of the iFrame no idea how to do that... Otherwise text fields get focus and will wreak havoc with keyboard input... maybe remove autofocus somehow from all the html and any calls to .focus... it will mess with CSS, but that is ok... have this as an optional thing?

    // TODO: Navigation is probably best done by deep-linking, otherwise all classes we nav to will need to be imported here and mapped from strings (Which you'd except, but would be good to minimise that) - or we set up a registry...


    async executeScript() {
        if (this.currentLine >= this.script.length) return;
        let line = this.script[this.currentLine];
        this.currentLine++;

        switch (line[0]) {
            case 'eval':
                let result = eval ('(' + line[1] + ')');
                if (result instanceof Promise) await (<Promise<any>> result).then();
                break;
            case 'nav':
                await this.nav.push(this.classMap[line[1]], undefined, {animate: false});
                break;
            case 'root':
                await this.nav.setRoot(this.classMap[line[1]], undefined, {animate: false});
                break;
            case 'db':
                // TODO
                break;
            default:
                throw new Error("Invalid Setup Command " + line[0]);
        }

        return this.executeScript();
            
    }

    async reset() {
        await this.nav.popToRoot({animate: false});
        //Close any modals
        //Clear the demo database

        //TODO: Optionally fade to black

    }
}
