import { Injectable } from "@angular/core";
import { App, NavController } from "ionic-angular";
import { BudgetPage } from "../pages/budget/budget";
import { DevPage } from "../pages/dev/dev";
import { HomePage } from "../pages/home/home";
import { Dbms } from "../db/dbms";
import { PersistenceProviderManager } from "../db/persistence-provider-manager";
import { NoPersistenceProvider } from "../db/no-persistence-provider";
import { InitBudgetTransaction } from "../data/transactions/init-budget-transaction";
import { TransactionSerializer } from "../db/transaction-serializer";
import { Logger } from "../services/logger";

@Injectable()
export class DemoSetup {
    vars: any = {};
    nav: NavController;

    script: Array<any>;
    currentLine: number;

    classMap = {
        budget: BudgetPage,
        dev: DevPage
    };

    constructor(private ionicApp: App, private dbms: Dbms, private persistenceProviderManager: PersistenceProviderManager, private transactionSerializer: TransactionSerializer) {
        
    }

    async setup(script: Array<any>) {
        this.script = script;
        this.currentLine = 0;

        this.nav = this.ionicApp.getActiveNav();
        await this.executeScript();
        await this.fadeIn();
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

        let line = this.script[this.currentLine].slice();
        this.currentLine++;

        Object.keys(this.vars).forEach(key => {
            for (let i = 1; i < line.length; i++) {
                line[i] = JSON.parse(JSON.stringify(line[i]).replace('${' + key + '}', this.vars[key]));
            }
        });

        switch (line[0]) {
            case 'eval':
                let result = eval ('(' + line[1] + ')');
                if (result instanceof Promise) await (<Promise<any>> result).then();
                break;
            case 'nav':
            // TODO: How to get ID of budget / category, etc ?
            /* Maybe a get/set variable and then can inject those into the scripts using some find/replace, like ${variableName}
            Some command can implicitly set a variable
            Or have query commands to get a budget / category by name, etc ?

            */

                await this.nav.push(this.classMap[line[1]], line.length > 2 ? line[2] : undefined, {animate: false});
                break;
            case 'root':
                await this.nav.setRoot(this.classMap[line[1]], line.length > 2 ? line[2] : undefined, {animate: false});
                break;
            case 'create-db':
                let db = await this.dbms.createDb();
                this.vars['current-db-id'] = db.id;
                let t = new InitBudgetTransaction();
                t.budgetName = line[1];
                db.applyTransaction(t);
                break;
            case 'transaction':
                let transaction = this.transactionSerializer.newTransaction(line[1], line[2]);
                this.dbms.getDb(this.vars['current-db-id']).applyTransaction(transaction);
                break;
            case 'import-db' :
                // TODO: Import a whole database json so we can just use a pre setup database ? - Maybe base this off an "export / clone" database command so we don't have to make the database Ids portable
                break;
            default:
                throw new Error("Invalid Setup Command " + line[0]);
        }

        return this.executeScript();
            
    }

    async reset() {
        await this.fadeOut();

        await this.nav.popToRoot({animate: false});
        //await this.nav.setRoot(HomePage, undefined, {animate: false});        
        let persistenceProvider = this.persistenceProviderManager.provide();
        if (persistenceProvider instanceof NoPersistenceProvider) {
            (<NoPersistenceProvider> persistenceProvider).reset();
            await this.dbms.init();
        }
        //Close any modals

        this.vars = {};

        await this.setup(this.script);
    }

    async fadeOut(instant: boolean = false) {
        Logger.get('demo-setup').info('demo fade-out');
        if (document.getElementById('demo-blank')) {
            document.getElementById('demo-blank').className='active';            
        } else {
            let ele = document.createElement('div');
            ele.id = 'demo-blank';
            document.body.appendChild(ele);
            if (instant) {
                ele.className='active';
            } else {
                await new Promise(resolve => setTimeout(() => {ele.className='active'; resolve();}));
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async fadeIn() {
        Logger.get('demo-setup').info('demo fade-in');

        if (!document.getElementById('demo-blank')) return;

        let ele = document.getElementById('demo-blank');
        ele.className = '';
        await new Promise(resolve => setTimeout(resolve, 1000));
        ele.remove();
    }
}
