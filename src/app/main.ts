import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

import {LoggerStorageAppender} from '../services/logger-storage-appender';
import {LoggerUINotifierAppender} from '../services/logger-ui-notifier-appender';
import {Logger} from '../services/logger';

Logger.root.config.addAppender(new LoggerStorageAppender('default'));
Logger.root.config.addAppender(LoggerUINotifierAppender.instance);

window.onerror = function(msg, url, line, col, error) {
   var extra = !col ? '' : '\ncolumn: ' + col;
   Logger.get('window').error(msg + '\nurl: ' + url + '\nline: ' + line + extra, error);

   return true;
};


platformBrowserDynamic().bootstrapModule(AppModule);
