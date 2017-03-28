import {Injectable} from '@angular/core';
import {Engine} from './engine';
import {Db} from '../db/db';
import {Dbms} from '../db/dbms';


@Injectable()
export class EngineFactory {
    
    constructor(private dbms: Dbms) {

            // TODO: some kind of "activate" listener on Db to process transactions as they go? - Or better to do it afterwards, then incrementally do it ?
        
    }
    
    getEngineById(dbId: string): Engine {
        return this.getEngine(this.dbms.getDb(dbId));
    }

    getEngine(db: Db): Engine {
        if (!(<any> db).engine) {
            
            let engine = new Engine(db);
            (<any> db).engine = engine;
        }
        
        return (<any> db).engine;
    }
}