import {Injectable} from '@angular/core';
import {Db} from './db';
import {DbPersistenceProvider} from './db-persistence-provider';
import {PersistenceProviderManager} from './persistence-provider-manager';
import Loki from 'lokijs';
import {TransactionSerializer} from './transaction-serializer';
import { Utils } from "../services/utils";
import { Configuration } from "../services/configuration-service";
import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";

@Injectable()
export class Dbms {
    private _dbInitialisedObservable: Observable<Db>;
    private dbInitialisedObserver: Subscriber<Db>;
    
    private loki: Loki;
    private persistenceProvider: DbPersistenceProvider;
    public dbs: Array<Db>;
    private dbMap: Map<string, Db>;
    public initialising: boolean;
        
    constructor(private transactionSerializer: TransactionSerializer, persistenceProviderManager: PersistenceProviderManager, public configuration: Configuration) {
        this.persistenceProvider = persistenceProviderManager.provide();
        this.dbs = [];
        this.dbMap = new Map<string, Db>();
        this._dbInitialisedObservable = new Observable<Db>(observer => this.dbInitialisedObserver = observer).share();
    }
    
    init(): Promise<void> {
        this.initialising = true;

        this.dbs.length = 0;
        this.dbMap.clear();
        this.loki = new Loki(null);
        this.loki.autosaveDisable();

        let inits = new Array<Promise<any>>();

        this.persistenceProvider.dbs().forEach((dbId) => {
            inits.push(this.createDb(dbId));
        });

        // this.fireEvent("initialised", true);

        return Promise.all(inits).then(() => { this.initialising = false; });
    }
    
    
    getDb(id: string): Db {
        return this.dbMap.get(id);
    }

    dbInitialisedObservable(): Observable<Db> {
        return this._dbInitialisedObservable;
    }
    
    createDb(id?: string): Promise<Db> {
        
        if (!id) id = Utils.randomChars(20);

        let db = new Db(id, this, this.persistenceProvider, this.loki, this.transactionSerializer);
        
        this.dbs.push(db);
        this.dbMap.set(id, db);

        if (!this.initialising) {
            return this.persistenceProvider.addDb(id).then(() => {
                return db.init().then(() => {
                    this.dbInitialisedObserver.next(db);
                    return db;
                });
            });
        } else {
            return db.init().then(() => {
                this.dbInitialisedObserver.next(db);
                return db;
            });
        }

    }

    deleteDb(id: string) {
        let db = this.getDb(id);
        this.dbs.splice(this.dbs.indexOf(db), 1);
        this.dbMap.delete(id);
        db.deleteInternal();
        this.persistenceProvider.unlinkDb(id);
    }

}