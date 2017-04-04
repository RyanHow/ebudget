export class Logger {

    public static root: Logger;
    public static DEBUG = 1;
    public static INFO = 2;
    public static ERROR = 3;

    private _config: LoggerConfig;

    constructor(public name?: string) {
        this._config = new LoggerConfig();
    }

    public static get(name?: string): Logger {
        // TODO: Store in a static map for persistent per logger based configuration.
        if (typeof name === 'undefined') return Logger.root;

        let logger = new Logger();
        logger.config.parent = Logger.root; // TODO A heirarchy based off . separators?
        return logger;
    }

    get config(): LoggerConfig {
        return this._config;
    }

    debug(...data: any[]) {
        this.log(Logger.DEBUG, data);
    }

    info (...data: any[]) {
        this.log(Logger.INFO, data);
    }

    error (...data: any[]) {
        this.log(Logger.ERROR, data);
    }

    private log (level: number, data: any[]) {

        if (this.config.level > level) return;

        this.config.getAppenders().forEach(appender => {
            appender.log(level, data);
        });

    }

    public static stringValue(value: any): string {
        if (typeof value === 'undefined') return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'function') return Logger.stringValue(value());

        if (value instanceof Error) {
            // TODO: If Error then need to print a stack trace, message, etc
            return "[Error]: " + value;
        }

        // TODO: Maybe return these as some kind of wrapped type so we can group logging on them, or log the object to console, but the string version to a file
        // .. And the .toString() method will just return the string value of it, so it is kinda like just returning a string...
        // TODO: Will implement as needed...

        // TODO: ViewWrappedError

        if (value === Object(value)) {
            if (value instanceof Array) {
                // TODO: Iterate it and run each of the values ?
            }

            if (typeof value.toLog === 'function') {
                return value.toLog();
            }

            // TODO: test for certain kind of objects and run through the values of them ?.
            let cache = [];
            try {
                let json = JSON.stringify(value, function(key, value) {
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return '[circular]';
                        }
                        // Store value in our collection
                        cache.push(value);
                    }
                    return value;
                });
                if (json.length > 2000) json = json.substr(0, 2000) + '...[truncated]';

                return json;
            } catch (err) {
                return "Error Stringifying value: " + value;
            }

        }

    }

}

export class LoggerConfig {
    parent: Logger;
    private _level: number;
    private _appenders: LoggerAppender[] = [];

    get level(): number {
        if (typeof this._level === 'undefined') return this.parent.config.level;
        return this._level;
    }
    set level(value: number) {
        this._level = value;
    }
    getAppenders(): LoggerAppender[] {
        if (typeof this.parent === 'undefined') return this._appenders;
        return this._appenders.concat(this.parent.config.getAppenders());
    }
    addAppender(appender: LoggerAppender) {
        return this._appenders.push(appender);
    }

    // Removing appenders - Do it when/if eventually needed

    
}

export interface LoggerAppender { 
    log (level: number, data: any[]);
}

export class LoggerConsoleAppender implements LoggerAppender {
     log (level: number, data: any[]) {

        let message = data.length > 0 ? Logger.stringValue(data[0]) : '.';
        let extradata: any[] = null;
        if (message === data[0]) {
            extradata = data.slice(1);
        }

        if (level === Logger.DEBUG || level === Logger.INFO) {
            if (extradata !== null && extradata.length > 0) {
                console.groupCollapsed(message);
                console.info(extradata);
                console.groupEnd();
            } else {
                console.info(message);
            }
        } else if (level === Logger.ERROR) {
            if (extradata !== null && extradata.length > 0) {
                console.groupCollapsed(message);
                console.error(extradata);
                console.groupEnd();
            } else {
                console.error(message);
            }
        }

     }
}

Logger.root = new Logger();
Logger.root.config.level = Logger.DEBUG;
Logger.root.config.addAppender(new LoggerConsoleAppender());