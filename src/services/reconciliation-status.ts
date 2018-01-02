import { Injectable } from "@angular/core";
import { Notifications } from "./notifications";
import { Configuration } from "./configuration-service";
import { EngineFactory } from "../engine/engine-factory";
import { Dbms } from "../db/dbms";
import { Engine } from "../engine/engine";

@Injectable()
export class ReconciliationStatus {

    constructor(private notifications: Notifications, private configuration: Configuration, private dbms: Dbms, private engineFactory: EngineFactory) {

        dbms.dbInitialisedObservable().subscribe(db => {
            let engine = this.engineFactory.getEngine(db);

            engine.bankTransactionUnreconciledDynamicView.on('rebuild', e => {
                if (!db.isActive()) return;
                this.notifyReconciliationChange(engine);
            });

            db.on('db-activated').subscribe(dbEvent => {
                if (engine.bankTransactionUnreconciledDynamicView.data().length > 0) {
                    this.notifyReconciliationChange(engine);
                }
            })

        });

    }

    notifyReconciliationChange(engine: Engine): any {
        this.notifications.show({message: engine.bankTransactionUnreconciledDynamicView.data().length + ' bank transactions to reconcile', category: 'reconciliation-status', budgetId: engine.db.id});                
    }

}