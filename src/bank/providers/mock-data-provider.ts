import {ProviderInterface, BankAccount, BankAccountTransaction, ProviderSchema} from '../provider-interface';
import {HostInterface} from '../host-interface';
import { BankLink } from "../../data/records/bank-link";
import { SecureAccessor } from "../../services/configuration-service";

export class MockDataProvider implements ProviderInterface {

    accounts : BankAccount[] = [{accountName: "Mock Account", accountNumber: "12345678", accountBalance: "1430.00", accountAvailableBalance: "1400.00", bsb: "555666"}];

    data : BankAccountTransaction[][] = <any> [
            [
                {"description":"VISA DEBIT AUTHORISATION COLES EXPRESS 2010 BUSSELTON AU Card Used 9038","amount":"-1.50","balance":"","status":"authorised","transactionDate":"20170427"},
                {"description":"VISA DEBIT AUTHORISATION BEST AND LESS BUSSELTON AU Card Used 9020","amount":"-28.00","balance":"","status":"authorised","transactionDate":"20170427"},
                {"description":"VISA DEBIT AUTHORISATION CALLOWS CORNER NEWS BUSSELTON AU Card Used 9020","amount":"-40.95","balance":"","status":"authorised","transactionDate":"20170427"},
                {"description":"VISA DEBIT AUTHORISATION FOOTBALL FEDERATIO N AUSTRSYDNEYAU Card Used 9020","amount":"-110.00","balance":"","status":"authorised","transactionDate":"20170426"},
                {"description":"VISA DEBIT AUTHORISATION HARMONY HAIR AND BEAUT BUSSELTON AU Card Used 9038","amount":"-15.00","balance":"","status":"authorised","transactionDate":"20170426"},
                {"description":"VISA DEBIT AUTHORISATION WOOLWORTHS 4416 BUSSELTON AU Card Used 9038","amount":"-28.57","balance":"","status":"authorised","transactionDate":"20170425"},
                {"description":"VISA DEBIT AUTHORISATION TERRY WHITE CHEMISTS BUSSELTON AU Card Used 9020","amount":"-108.55","balance":"","status":"authorised","transactionDate":"20170424"},

                {"description":"EFTPOS Cape Chiropract3227592 \\BUSSELTON06","amount":"-55.00","balance":"","status":"processed","transactionDate":"20170428"},
                {"description":"EFTPOS THE REJECT SHOP 610 BUSSELTON AU","amount":"-6.00","balance":"","status":"recent","transactionDate":null},

                {"description":"ANZ INTERNET BANKING FUNDS TFER DAY CARE MAMA BIRD","amount":"62.50","balance":"","status":"processed","transactionDate":"20170427"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2010 BUSSELTON","amount":"-1.50","balance":"","status":"processed","transactionDate":"20170427"},
                {"description":"ANZ INTERNET BANKING BPAY TAX OFFICE PAYMENT {238536},","amount":"-907.00","balance":"","status":"processed","transactionDate":"20170424"},
                {"description":"ANZ INTERNET BANKING BPAY SGIO INSURANCE {240659},","amount":"-653.60","balance":"","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9020 DYNAMIC ORGANIC (WA) MANDURAH","amount":"-45.00","balance":"","status":"processed","transactionDate":"20170421"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2010 BUSSELTON","amount":"-1.50","balance":"","status":"processed","transactionDate":"20170418"}
            ], []

    ];

    getSchema(): ProviderSchema {
        let s = new ProviderSchema();
        s.name = "Mock";
        s.perAccountFields = ["Account Number"];
        s.secureConfigurationFields = ["CRN", "Password"];
        return s;
    }

    configure(bankLink: BankLink, secureAccessor: SecureAccessor, hostInterface: HostInterface): void {
        
    }

    connect(): Promise<void> {
        return Promise.resolve();
    }

    isConnected(): boolean {
        return true;
    }

    getAccounts(): Promise<BankAccount[]> {
        return Promise.resolve(this.accounts);
    }

    getTransactions(account: BankAccount): Promise<BankAccountTransaction[]> {

        // TODO: Increment / multiple versions of the data for test cases

        return Promise.resolve(this.data[0]);
    }

    close(): Promise<void> {
        return Promise.resolve();
    }   

}