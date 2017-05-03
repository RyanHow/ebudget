import {ProviderInterface, BankAccount, BankAccountTransaction} from '../provider-interface';
import {HostInterface} from '../host-interface';

export class MockDataProvider implements ProviderInterface {

    accounts : BankAccount[] = [{accountName: "Mock Account", accountNumber: "12345678", accountBalance: "1430.00", bsb: "555666"}];

    data : BankAccountTransaction[][] = <any> [
            [
                {"description":"VISA DEBIT AUTHORISATION COLES EXPRESS 2010 BUSSELTON AU Card Used 9038","amount":"-1.50","balance":"","status":"authorised","transactionDate":"20170427"},
                {"description":"VISA DEBIT AUTHORISATION BEST AND LESS BUSSELTON AU Card Used 9020","amount":"-28.00","balance":"","status":"authorised","transactionDate":"20170427"},
                {"description":"VISA DEBIT AUTHORISATION CALLOWS CORNER NEWS BUSSELTON AU Card Used 9020","amount":"-40.95","balance":"","status":"authorised","transactionDate":"20170427"},
                {"description":"VISA DEBIT AUTHORISATION FOOTBALL FEDERATIO N AUSTRSYDNEYAU Card Used 9020","amount":"-110.00","balance":"","status":"authorised","transactionDate":"20170426"},
                {"description":"VISA DEBIT AUTHORISATION HARMONY HAIR AND BEAUT BUSSELTON AU Card Used 9038","amount":"-15.00","balance":"","status":"authorised","transactionDate":"20170426"},
                {"description":"VISA DEBIT AUTHORISATION WOOLWORTHS 4416 BUSSELTON AU Card Used 9038","amount":"-28.57","balance":"","status":"authorised","transactionDate":"20170425"},
                {"description":"VISA DEBIT AUTHORISATION TERRY WHITE CHEMISTS BUSSELTON AU Card Used 9020","amount":"-108.55","balance":"","status":"authorised","transactionDate":"20170424"},
                {"description":"EFTPOS Cape Chiropract3227592 \\BUSSELTON06","amount":"-55.00","balance":"","status":"recent","transactionDate":null},
                {"description":"EFTPOS THE REJECT SHOP 610 BUSSELTON AU","amount":"-6.00","balance":"","status":"recent","transactionDate":null},
                {"description":"ANZ INTERNET BANKING FUNDS TFER DAY CARE MAMA BIRD","amount":"62.50","balance":"1296.66","status":"processed","transactionDate":"20170427"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 REPCO 016457 BUSSELTON","amount":"-10.52","balance":"1234.16","status":"processed","transactionDate":"20170427"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2010 BUSSELTON","amount":"-1.50","balance":"1244.68","status":"processed","transactionDate":"20170427"},
                {"description":"ANZ INTERNET BANKING BPAY TAX OFFICE PAYMENT {238536},","amount":"-907.00","balance":"1246.18","status":"processed","transactionDate":"20170424"},
                {"description":"ANZ INTERNET BANKING BPAY SGIO INSURANCE {240659},","amount":"-653.60","balance":"2153.18","status":"processed","transactionDate":"20170424"},
                {"description":"EFTPOS COLES 0291 BUSSELTON","amount":"-187.26","balance":"2806.78","status":"processed","transactionDate":"20170424"},
                {"description":"PAYMENT TO PAYPAL AUSTRALIA 1000951539069","amount":"-13.19","balance":"2994.04","status":"processed","transactionDate":"20170424"},
                {"description":"ANZ INTERNET BANKING FUNDS TFER TRANSFER 237254 FROM 382179105","amount":"850.00","balance":"3007.23","status":"processed","transactionDate":"20170424"},
                {"description":"ANZ INTERNET BANKING FUNDS TFER TRANSFER 241029 FROM 382179105","amount":"500.00","balance":"2157.23","status":"processed","transactionDate":"20170424"},
                {"description":"ANZ INTERNET BANKING TRANSFER WAGES ZBIT PTY LTD","amount":"350.00","balance":"1657.23","status":"processed","transactionDate":"20170424"},
                {"description":"ANZ INTERNET BANKING FUNDS TFER TRANSFER 660227 TO RYAN HOW HOME LO","amount":"-443.00","balance":"1307.23","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 DAN MURPHYS 4904 BUSSELTON","amount":"-25.93","balance":"1750.23","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 ASTERON LIFE SYDNEY","amount":"-87.42","balance":"1776.16","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 BAM 2000 PTY LTD GREENFIELDS","amount":"-9.40","balance":"1863.58","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2014 BUNBURY","amount":"-2.00","balance":"1872.98","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2023 HALLS HEAD","amount":"-0.80","balance":"1874.98","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9020 COMPASSION AUSTRALIA WARABROOK","amount":"-72.00","balance":"1875.78","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 LORIMAR HOLDINGS PTY L BUNBURY","amount":"-6.00","balance":"1947.78","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9020 BEST AND LESS BUSSELTON","amount":"-24.00","balance":"1953.78","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 SUPERCHEAP AUTO WEST BUSSELTO","amount":"-13.98","balance":"1977.78","status":"processed","transactionDate":"20170424"},
                {"description":"VISA DEBIT PURCHASE CARD 9020 DYNAMIC ORGANIC (WA) MANDURAH","amount":"-45.00","balance":"1991.76","status":"processed","transactionDate":"20170421"},
                {"description":"VISA DEBIT PURCHASE CARD 9020 CARLY JANE CROUCH SILVER SANDS","amount":"-10.00","balance":"2036.76","status":"processed","transactionDate":"20170421"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2014 BUNBURY","amount":"-53.10","balance":"2046.76","status":"processed","transactionDate":"20170421"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2010 BUSSELTON","amount":"-4.90","balance":"2099.86","status":"processed","transactionDate":"20170421"},
                {"description":"VISA DEBIT PURCHASE CARD 9020 POST BUSSELTON RET BUSSELTON","amount":"-9.20","balance":"2104.76","status":"processed","transactionDate":"20170421"},
                {"description":"ANZ INTERNET BANKING FUNDS TFER DAY CARE MAMA BIRD","amount":"62.50","balance":"2113.96","status":"processed","transactionDate":"20170420"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2010 BUSSELTON","amount":"-2.00","balance":"2051.46","status":"processed","transactionDate":"20170420"},
                {"description":"TRANSFER FROM MEDIBANK TELEHEA PAY ADV 2000088433","amount":"160.96","balance":"2053.46","status":"processed","transactionDate":"20170418"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES 0291 BUSSELTON","amount":"-103.11","balance":"1892.50","status":"processed","transactionDate":"20170418"},
                {"description":"VISA DEBIT PURCHASE CARD 9038 COLES EXPRESS 2010 BUSSELTON","amount":"-1.50","balance":"1995.61","status":"processed","transactionDate":"20170418"}
            ], []

    ];

    getName(): string {
        return "Mock";
    }

    connect(hostInterface: HostInterface): Promise<void> {
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