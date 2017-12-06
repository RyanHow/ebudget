import {Injectable} from '@angular/core';
import {DbPersistenceProvider} from './db-persistence-provider';
import {LocalStoragePersistenceProvider} from './local-storage-persistence-provider';
import {TransactionSerializer} from './transaction-serializer';
import {SqlStoragePersistenceProvider} from './sql-storage-persistence-provider';
import {SQLite} from '@ionic-native/sqlite';
import {Platform} from 'ionic-angular';
import {Device} from '@ionic-native/device';
import { Utils } from "../services/utils";
import { NoPersistenceProvider } from "./no-persistence-provider";

@Injectable()
export class PersistenceProviderManager  {

    private persistenceProvider: DbPersistenceProvider;
 
    constructor(private transactionSerializer: TransactionSerializer, private platform: Platform, private device: Device, private sqlite: SQLite) {
    }

    provide(): DbPersistenceProvider {
        if (this.persistenceProvider == null) {
            if (Utils.getQueryStringValue('demo')) {
                this.persistenceProvider = new NoPersistenceProvider(this.transactionSerializer);
            } else if (this.platform.is('cordova') && this.device.platform !== 'browser') {
                this.persistenceProvider = new SqlStoragePersistenceProvider('A', this.transactionSerializer, this.sqlite);
            } else {
                this.persistenceProvider = new LocalStoragePersistenceProvider('A', this.transactionSerializer);
            }
        }

        return this.persistenceProvider;
    }
}