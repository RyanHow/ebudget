import {Injectable} from '@angular/core';
import {Engine} from './engine';
import {Db} from '../db/db';


@Injectable()
export class EngineFactory {
    
    constructor() {

            // TODO: some kind of "activate" listener on Db to process transactions as they go? - Or better to do it afterwards, then incrementally do it ?
        
    }
    
    getEngine(db: Db): Engine {
        if (!(<any> db).engine) {
            
            let engine = new Engine(db);
            (<any> db).engine = engine;
        }
        
        return (<any> db).engine;
    }
}