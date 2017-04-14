import {Injectable} from '@angular/core';

@Injectable()
export class AppReady {

    readyResolve: any;
    ready: Promise<any>;

    constructor() {
        // Emulate deferred...
        this.ready = new Promise((resolve, reject) => {this.readyResolve = resolve;});
    }
}
