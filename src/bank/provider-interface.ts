import {HostInterface} from './host-interface';
import { BankLink } from "../data/records/bank-link";
import { SecureAccessor } from "../services/configuration-service";

export class BankAccount {
    public accountName: string;
    public accountBalance: string;
    public accountAvailableBalance: string;
    public accountNumber: string;
    public bsb: string;
}

export class BankAccountTransaction {
    public transactionDate: string;
    public amount: string; // Big ?
    public balance: string;
    public description: string;
    public status: 'processed' | 'recent' | 'authorised';
    // TODO: Any "extra" information?. like balance, card used, etc?
}

export class ProviderSchema {
    name: string;
    perAccountFields: string[];
    configurationFields: string[];
    secureConfigurationFields: string[];
    requireBrowser?: boolean;
    singleInstancePerBankLink: boolean = true;
}

export interface ProviderInterface {
    getSchema(): ProviderSchema;

    configure(bankLink: BankLink, secure: SecureAccessor, hostInterface: HostInterface): void;

    connect(): Promise<void>;
    isConnected(): boolean;
    getAccounts(): Promise<BankAccount[]>;
    getTransactions(account: BankAccount): Promise<BankAccountTransaction[]>;
    close(): Promise<void>;
}