import {Injectable} from '@angular/core';
import {DbPersistenceProvider} from './db-persistence-provider';
import {LocalStoragePersistenceProvider} from './local-storage-persistence-provider';
import {TransactionSerializer} from './transaction-serializer';
import {SqlStoragePersistenceProvider} from './sql-storage-persistence-provider';
import {Platform} from 'ionic-angular';
import {Device} from 'ionic-native';

@Injectable()
export class PersistenceProviderManager  {

    private persistenceProvider: DbPersistenceProvider;
 
    constructor(private transactionSerializer: TransactionSerializer, private platform: Platform) {
        
    }

    provide(): DbPersistenceProvider {
        if (this.persistenceProvider == null) {
            if (this.platform.is('cordova') && Device.platform !== 'browser') {
                this.persistenceProvider = new SqlStoragePersistenceProvider('A', this.transactionSerializer);
            } else {
                this.persistenceProvider = new LocalStoragePersistenceProvider('A', this.transactionSerializer);
            }
        }

        return this.persistenceProvider;
    }
}