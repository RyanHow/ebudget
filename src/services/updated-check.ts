import {Injectable} from '@angular/core';
import {Notifications} from './notifications';
import {AppReady} from '../app/app-ready';
import {Logger} from './logger';

@Injectable()
export class UpdatedCheck {
    
    private logger: Logger = Logger.get('Notifications');

    constructor(appReady: AppReady, notifications: Notifications) {
        appReady.ready.then(() => {
            this.logger.info("TODO Check for updated");
            notifications.notify("TODO: Updated Check", true);
        });
    }
}