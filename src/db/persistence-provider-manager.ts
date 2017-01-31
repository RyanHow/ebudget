import {Injectable} from '@angular/core';
import {DbPersistenceProvider} from './db-persistence-provider';
import {LocalStoragePersistenceProvider} from './local-storage-persistence-provider';
import {TransactionSerializer} from './transaction-serializer';
import {SqlStoragePersistenceProvider} from './sql-storage-persistence-provider';
import {Storage} from '@ionic/storage';
import {Platform} from 'ionic-angular';

@Injectable()
export class PersistenceProviderManager  {

    private persistenceProvider: DbPersistenceProvider;
 
    constructor(private transactionSerializer: TransactionSerializer, private platform: Platform, private storage: Storage) {
        
    }

    provide(): DbPersistenceProvider {
        if (this.persistenceProvider == null) {
            if (this.platform.is('cordova')) {
                this.persistenceProvider = new SqlStoragePersistenceProvider('A', this.transactionSerializer, this.storage);
            } else {
                this.persistenceProvider = new LocalStoragePersistenceProvider('A', this.transactionSerializer);
            }
        }

        return this.persistenceProvider;
    }
}