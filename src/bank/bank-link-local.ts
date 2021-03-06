import { Injectable } from "@angular/core";
import { PersistenceProviderManager } from "../db/persistence-provider-manager";
import { DbPersistenceProvider } from "../db/db-persistence-provider";

export class BankLinkLocalInfo {
    autoSync: boolean;
    lastSync: number;
    errorCount: number;
    cancelledCount: number;
    pauseAutoSync: boolean;
}


@Injectable()
export class BankLinkLocal {

    private persistence: DbPersistenceProvider;

    constructor(persistenceProvider: PersistenceProviderManager) {
        this.persistence = persistenceProvider.provide();
    }

    getInfo(bankLinkUuid: string): BankLinkLocalInfo {
        let infoString = this.persistence.keyStore('bl_' + bankLinkUuid, 'info');
        if (infoString == null) return new BankLinkLocalInfo();
        return JSON.parse(infoString);
    }

    private saveInfo(bankLinkUuid: string, info: BankLinkLocalInfo) {
        if (info.errorCount > 0 || info.cancelledCount > 1) info.pauseAutoSync = true; // TODO: Notify / make this configurable
        else info.pauseAutoSync = false;
        
        this.persistence.keyStore('bl_' + bankLinkUuid, 'info', JSON.stringify(info));
    }

    updateInfo(bankLinkUuid: string, fun: (info: BankLinkLocalInfo) => void) {
        let info = this.getInfo(bankLinkUuid);
        fun(info);
        this.saveInfo(bankLinkUuid, info);
    }
}