import {Device} from '@ionic-native/device';
import {Platform} from 'ionic-angular';
import {Injectable} from '@angular/core';
import {PersistenceProviderManager} from '../db/persistence-provider-manager';
import {DbPersistenceProvider} from '../db/db-persistence-provider';
import {Logger} from './logger';
import {SecureStorage, SecureStorageObject} from '@ionic-native/secure-storage';

type ConfigurationOption = 'experimental.transaction.notifications'
                         | 'latest-version'
                         | 'experimental.modals.show-split-transaction'
                         | 'experimental.accounts.enabled'
                         | 'testing.secure-storage.enabled'
                         ;

export interface BooleanValueAccessor {
    value: boolean;
}

@Injectable()
export class Configuration {
    private logger: Logger = Logger.get('Configuration');

    private configured: boolean = false;
    public installationId: string;
    public deviceId: string;
    public deviceName: string;
    public deviceInstallationId: string;
    public native: boolean;
    public persistence: DbPersistenceProvider;
    public cId: string = 'conf';
    public temporary: any = {};
    private secure: SecureStorageObject;
    private secureCache: any;

    private booleanValueAccessor = class implements BooleanValueAccessor {
        constructor(private option: string, private configuration: Configuration) {
        }

        get value(): boolean {
            return this.configuration.persistence.keyStore(this.configuration.cId, this.option) === 'true';
        }

        set value(value: boolean) {
            this.configuration.persistence.keyStore(this.configuration.cId, this.option, value === undefined ? undefined : value ? 'true' : 'false');
        }
    }

    option(option: ConfigurationOption, value?: string): string {
        return this.persistence.keyStore(this.cId, option, value);
    }

    optionBoolean(option: ConfigurationOption, value?: boolean): boolean {
        return this.persistence.keyStore(this.cId, option, value === undefined ? undefined : value ? 'true' : 'false') === 'true';
    }

    optionBooleanAccessor(option: ConfigurationOption): BooleanValueAccessor {
        return new this.booleanValueAccessor(option, this);
    }

    get loglevel(): string {
        return this.persistence.keyStore(this.cId, 'loglevel');
    }

    set loglevel(value: string) {
        this.persistence.keyStore(this.cId, 'loglevel', value);
    }

    removeSecure(key: string): Promise<string> {
        let originalValue = this.secureCache[key];
        delete this.secureCache[key];

        return !this.native || (this.optionBoolean('testing.secure-storage.enabled') && !this.secure) ? Promise.resolve(originalValue) : this.secure.remove(key).catch(reason => {
            this.logger.info("Unable to update secure storage", reason);
            this.secureCache[key] = originalValue;
            throw reason;
        });

    }

    setSecure(key: string, value: string): Promise<string> {
        if (value === undefined) {
            return this.removeSecure(key);
        }

        let originalValue = this.secureCache[key];
        this.secureCache[key] = value;

        return (!this.native || this.optionBoolean('testing.secure-storage.enabled')) ? Promise.resolve(originalValue) : this.secure.set('secure', JSON.stringify(this.secureCache)).catch(reason => {
            this.logger.info("Unable to update secure storage", reason);
            this.secureCache[key] = originalValue;
            throw reason;
        });
    }

    getSecure(key: string): string {
        return this.secureCache[key];
    }

    secureAvailable(): boolean {
        return this.secureCache != null;
    }
    
    constructor(private persistenceProviderManager: PersistenceProviderManager, private platform: Platform, private device: Device, private secureStorage: SecureStorage) {

    }
    
    configure(): Promise<void> {
        // Note: This has already been initialised....

        this.persistence = this.persistenceProviderManager.provide();

        this.initLogLevel();

        if (this.platform.is('cordova')) {
        this.logger.info('Running cordova');
            this.native = true;
            this.logger.info('Device Info');
            this.logger.info("name: " +  Device.name);
        }
        if (!this.platform.is('cordova')) {
        this.logger.info('Running web browser');
            this.native = false;
        } 

        // Device and install Ids
        if (! this.persistence.keyStore(this.cId, 'installationId')) this.persistence.keyStore(this.cId, 'installationId', 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random() * 16 | 0, v = c === 'x' ? r : r & 0x3 | 0x8; return v.toString(16); }));
        this.installationId = this.persistence.keyStore(this.cId, 'installationId');
        this.logger.info('Installation Id: ' + this.installationId);
        this.deviceId = this.device.uuid ? this.device.uuid.toLowerCase() : this.installationId;
        this.logger.info("Device id: " +  this.deviceId);
        this.deviceName = !this.native ? 'Web Browser' : this.device.model || 'Mobile Device';
        if (this.deviceName.length <= 3) this.deviceName = this.deviceName + "___";
        this.logger.info("Device name: " +  this.deviceName);
        if (! this.persistence.keyStore(this.cId, 'deviceId')) this.persistence.keyStore(this.cId, 'deviceId', this.deviceId);
        // Unique to this device and installation
        this.deviceInstallationId = this.deviceId + '-' + this.installationId;

        this.configured = true;

        return this.secureStorage.create('eBudget').then((secureStorageObject: SecureStorageObject) => {
            this.secure = secureStorageObject;
            if (!this.native) {
                throw new Error("Browser has no implementation of secure storage");
            }
            return this.secure.keys();
        }).then(keys => {
            if (keys.indexOf('secure') >= 0) return this.secure.get('secure');
            else return '{}';
        }).then(secureObjectString => {
            this.secureCache = JSON.parse(secureObjectString);
            this.logger.info("Secure storage initialised");
        }).catch(reason => {
            this.logger.info("Secure storage unable to be initialised", reason);
            if (this.optionBoolean('testing.secure-storage.enabled')) this.secureCache = {};
        });

    }

    initLogLevel() {
        if (this.loglevel === 'Debug') {
            Logger.root.config.level = Logger.DEBUG;
        } else {
            Logger.root.config.level = Logger.INFO;
        }
    }
    
    lastOpenedBudget(budgetId?: string): string {
        if (!this.configured) return null;

        return this.persistence.keyStore(this.cId, 'autoOpenBudgetId', budgetId);
    }
    
    
    
}




