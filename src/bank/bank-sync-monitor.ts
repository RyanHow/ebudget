import { Observer } from "rxjs/Observer";
import { Observable } from "rxjs/Observable";
import { BankLink } from "../data/records/bank-link";
import { ProviderSchema, ProviderInterface } from "./provider-interface";
import { Engine } from "../engine/engine";
import { Logger } from "../services/logger";
import { Account } from "../data/records/account";

type SyncEventType = 'complete-state-change' | 'error-state-change' | 'running-state-change' | 'cancelling-state-change' | 'cancelled-state-change';

export class SyncEvent {
    event: string;
    constructor(event: SyncEventType) {
        this.event = event;
    }
}

export class BankSyncMonitor {
    observer: Observer<SyncEvent>;
    source: Observable<SyncEvent>;

    constructor() {
        this.source = new Observable<SyncEvent>(observer => {this.observer = observer;}).share();
    }

    error(message: string) {
        if (!this.errors) {
            this.errors = true;
            this.errorMessage = message;
        } else {
            this.errorMessage += '\n' + message;
        }
        this.observer.next(new SyncEvent('error-state-change'));
    }

    bankLink: BankLink;
    providerSchema: ProviderSchema;
    provider: ProviderInterface;
    engine: Engine;
    accounts: Account[];

    logger: Logger;
    log: string[] = [];

    backgroundMode: boolean;

    startTime: number;

    cancel() {
        if (!this.cancelling) {
            this.cancelling = true;
            this.provider.interrupt();
        }
    }

    public errorMessage: string;
    public errors: boolean;
    private _running: boolean;
    private _complete: boolean;
    private _cancelling: boolean;
    private _cancelled: boolean;

    get cancelling() {return this._cancelling;}
    set cancelling(value: boolean) {this._cancelling = value; if (this.observer) this.observer.next(new SyncEvent('cancelling-state-change'));}
    get running() {return this._running;}
    set running(value: boolean) {this._running = value; if (this.observer) this.observer.next(new SyncEvent('running-state-change'));}
    get complete() {return this._complete;}
    set complete(value: boolean) {
        this._complete = value;
        if (this.observer) {
            this.logger.debug("Firing Complete");
            this.observer.next(new SyncEvent('complete-state-change'));
        }
    }
    get cancelled() {return this._cancelled;}
    set cancelled(value: boolean) {this._cancelled = value; if (this.observer) this.observer.next(new SyncEvent('cancelled-state-change'));}

    on(event: SyncEventType): Observable<SyncEvent> {
        return this.source.filter(ev => ev.event == event);
    }
    
}
