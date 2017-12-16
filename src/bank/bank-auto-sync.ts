import { Injectable } from "@angular/core";
import { BankLinkLocal } from "./bank-link-local";
import { AppReady } from "../app/app-ready";
import { EngineFactory } from "../engine/engine-factory";
import { Dbms } from "../db/dbms";
import { Db } from "../db/db";
import { BankSync } from "./bank-sync";
import { BankSyncUtils } from "./bank-sync-utils";
import { Notifications } from "../services/notifications";
import { Logger } from "../services/logger";

@Injectable()
export class BankAutoSync {

    private log = Logger.get('bank-auto-sync');

    constructor(private bankLinkLocal: BankLinkLocal, appReady: AppReady, private engineFactory: EngineFactory, private dbms: Dbms, private bankSync: BankSync, private notifications: Notifications) {
        appReady.ready.then(() => {
            setTimeout(() => {
                this.log.info("Starting auto sync scheduler");
                this.scheduleBankAutoSync();
            }, 10000);
        });
    }

    private scheduleBankAutoSync() {
        setTimeout(() => this.scheduleBankAutoSync(), 60000);            

        this.dbms.dbs.forEach(db => {
            if (db.isActive()) {
                this.autoSync(db);
            }
        })
    }

    /**
     * Runs the auto bank sync for all bank links with autosync for the DB< if they are past their scheduled time
     */
    public autoSync(db: Db) {
        let engine = this.engineFactory.getEngine(db);
        let bankLinks = engine.getBankLinks();
        bankLinks.forEach(bankLink => {
            let info = this.bankLinkLocal.getInfo(bankLink.uuid);
            let timeDiffHours = info.lastSync == null ? Date.now() : (Date.now() - info.lastSync) / (1000 * 60 * 60);
            if (info.autosync && timeDiffHours > 12) {
                this.log.info("Auto syncing bank link " + bankLink.name);
                let monitor = BankSyncUtils.createMonitorWithNotifications(this.notifications);
                this.bankSync.sync(bankLink, engine, undefined, monitor);
            }
        });
    }

}