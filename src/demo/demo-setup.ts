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

        this.nav = this.ionicApp.getActiveNavs()[0];
        await this.executeScript();
        await this.fadeIn();
    }

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

    async clear() {
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
    }

    async reset() {
        await this.clear();
        await this.setup(this.script);
    }

    async fadeOut(instant: boolean = false) {

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

        if (!document.getElementById('demo-blank')) return;

        let ele = document.getElementById('demo-blank');
        ele.className = '';
        await new Promise(resolve => setTimeout(resolve, 1000));
        ele.remove();
    }
}
