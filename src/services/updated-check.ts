import {Injectable} from '@angular/core';
import {Notifications} from './notifications';
import {Configuration} from './configuration-service';
import {AppReady} from '../app/app-ready';
import {Logger} from './logger';
import {BuildInfo} from '../app/build-info';
import { Utils } from "./utils";

@Injectable()
export class UpdatedCheck {
    
    private logger: Logger = Logger.get('Notifications');

    constructor(appReady: AppReady, notifications: Notifications, configuration: Configuration) {

        if (Utils.getQueryStringValue('demo')) return; // Skip this for demos

        appReady.ready.then(() => {
            let latestVersion = configuration.option('latest-version');
            if (BuildInfo.version !== latestVersion || BuildInfo.version === "%BUILD_INFO_VERSION%") {
                configuration.option('latest-version', BuildInfo.version);
                let message = "Updated to version " + BuildInfo.version;
                this.logger.info(message);
                // notifications.show({message: message, popup: true, silent: true, category: 'app-updated'});
            }
        });
    }
}