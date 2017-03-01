import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

import {LoggerStorageAppender} from '../services/logger-storage-appender';
import {LoggerUINotifierAppender} from '../services/logger-ui-notifier-appender';
import {Logger} from '../services/logger';

Logger.root.config.addAppender(new LoggerStorageAppender('default'));
Logger.root.config.addAppender(LoggerUINotifierAppender.instance);

// These are to catch error if angular hasn't initialised yet, so if there is a bootstrap error then these will take care of those...
// Otherwise the angular error handler will handle the errors and these will be superceeded

window.onerror = function(msg, url, line, col, error) {
   var extra = !col ? '' : '\ncolumn: ' + col;
   Logger.get('window').error(msg + '\nurl: ' + url + '\nline: ' + line + extra, error);

   return false;
};

(<any> window).onunhandledrejection = function(event: any) {
    Logger.get('window').error("Unhandled Promise Rejection", event);

    return false;
};

platformBrowserDynamic().bootstrapModule(AppModule);
