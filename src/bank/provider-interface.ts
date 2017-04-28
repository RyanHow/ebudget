import {HostInterface} from './host-interface';

export class BankAccount {
    public accountName: string;
    public accountBalance: string;
    public accountNumber: string;
    public bsb: string;
}

export class BankAccountTransaction {
    public transactionDate: string;
    public amount: string; // Big ?
    public description: string;
    public status: 'processed' | 'recent' | 'authorised';
    // TODO: Any "extra" information?. like balance, card used, etc?
}

export interface ProviderInterface {
    getName(): string;
    connect(hostInterface: HostInterface): Promise<void>;
    isConnected(): boolean;
    getAccounts(): Promise<BankAccount[]>;
    getTransactions(account: BankAccount): Promise<BankAccountTransaction[]>;
    close(): Promise<void>;
}