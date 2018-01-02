import { Injectable } from "@angular/core";
import { Notifications } from "./notifications";
import { Configuration } from "./configuration-service";
import { EngineFactory } from "../engine/engine-factory";
import { Dbms } from "../db/dbms";
import { Engine } from "../engine/engine";
import { BankAccountPage } from "../pages/bank-account/bank-account";

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

        // TODO: Going to have to group and remember these by account!
        // Or set up and manage a few views with where clauses and monitor each one, I wonder how good our "rebuild" is.
        let accountId = engine.bankTransactionUnreconciledDynamicView.data().length > 0 ? engine.bankTransactionUnreconciledDynamicView.data()[0].accountId : null;
        let clickAction = accountId != null ? {type: 'page-nav', data: {page: BankAccountPage, params: {budgetId: engine.db.id, accountId: accountId}}} : undefined;

        this.notifications.show({
            message: engine.bankTransactionUnreconciledDynamicView.data().length + ' bank transactions to reconcile',
            category: 'reconciliation-status',
            budgetId: engine.db.id,
            clickAction: <any> clickAction
        });
    }

}