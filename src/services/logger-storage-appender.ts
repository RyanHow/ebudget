import {LoggerAppender, Logger} from './logger';

export class LoggerStorageAppender implements LoggerAppender {

    public static appenders: Map<string, LoggerStorageAppender> = new Map<string, LoggerStorageAppender>();
    public limit: number = 1000;

    constructor(private key: string) {
        LoggerStorageAppender.appenders.set(key, this);
    }

    public logLines: {timestamp: number; level: number; data: string[]}[] = [];

     log (level: number, data: any[]) {
         let stringData = new Array<string>();
         data.forEach(e => {
             stringData.push(Logger.stringValue(e) + '');
         });

         let length = this.logLines.push({timestamp: Date.now(), level: level, data: stringData});
         if (length > this.limit) this.logLines = this.logLines.splice(0, length - this.limit);
     }

     /**
      * Reverse chronological order (newest to oldest) dump of all the data
      */
     stringDump(): string {
         let all = '';
         for (let i = this.logLines.length - 1; i >= 0; i--) {
             all += this.lineToString(this.logLines[i]) + '\n';
         }
         return all;
     }

     lineToString(logLine: any): string {
         let d = new Date(logLine.timestamp);
         let dateString = d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate() + ' ' + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds() + '.' + (d.getMilliseconds() < 10 ? '00' : d.getMilliseconds() < 100 ? '0' : '') + d.getMilliseconds();
         let logLevel = logLine.level === 1 ? 'D' : logLine.level === 3 ? 'E' : 'I';
         let dataString = '';
         if (logLine.data.length > 0) dataString = Logger.stringValue(logLine.data[0]);
         //if (logLine.data.length > 1) dataString += '\n--------';
         for (let i = 1; i < logLine.data.length; i++) {
             dataString += '\n' + Logger.stringValue(logLine.data[i]);
         }
         //if (logLine.data.length > 1) dataString += '\n--------';
         return '[' + logLevel + ' ' + dateString + '] ' + dataString;
     }
}