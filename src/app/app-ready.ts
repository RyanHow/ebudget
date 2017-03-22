import {Injectable} from '@angular/core';

@Injectable()
export class AppReady {

    readyResolve: any;
    ready: Promise<void>;

    constructor() {
        // Emulate deferred...
        this.ready = new Promise((resolve, reject) => {this.readyResolve = resolve;});
    }
}
