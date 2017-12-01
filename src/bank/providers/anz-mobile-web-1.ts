import {ProviderInterface, BankAccount, BankAccountTransaction, ProviderSchema} from '../provider-interface';
import {HostInterface} from '../host-interface';
import {InAppBrowserObject} from '@ionic-native/in-app-browser';
import {Logger} from '../../services/logger';
import moment from 'moment';
import {Utils} from '../../services/utils'
import { BankLink } from "../../data/records/bank-link";
import { SecureAccessor } from "../../services/configuration-service";
import { ProviderRequiresBrowser, BrowserInterface } from "../browser-interface";

export class AnzMobileWeb1Provider implements ProviderInterface, ProviderRequiresBrowser {
    browser: BrowserInterface;

    secureAccessor: SecureAccessor;
    bankLink: BankLink;

    private logger = Logger.get('AnzMobileWeb1Provider');
    
    // TODO: Move this to some kind of helper

    connected: boolean;
    hostInterface: HostInterface;

    getSchema(): ProviderSchema {
        let s = new ProviderSchema();
        s.name = "ANZ";
        s.perAccountFields = ["Account Number"];
        s.secureConfigurationFields = ["CRN", "Password"];
        s.requireBrowser = true;
        return s;
    }

    configure(bankLink: BankLink, secureAccessor: SecureAccessor, hostInterface: HostInterface): void {
        this.bankLink = bankLink;
        this.secureAccessor = secureAccessor;
        this.hostInterface = hostInterface;
    }

    setBrowser(browser: BrowserInterface) {
        this.browser = browser;
    }

    async connect(): Promise<void> {

        await this.browser.navigate('https://www.anz.com/INETBANK/bankmain.asp');
        let crn = await this.secureAccessor.getSecure('CRN');
        let password = await this.secureAccessor.getSecure('Password');

        /*
        Note: determining current state can take into account clicks, scanning the page for familiar elements, window.location, timeout, etc. Also state can be a sure match, or unknown...
        Should be able to put criteria to determine the state, then also what to do in different situations
        So rather than this watcher business, define our states, then determine out state, and base our actions off the state...

        let loggedInWatcher = this.browser.watch("var ele = document.getElementsByTagName('H1')[0]; ele ? ele.textContent.trim().toLowerCase() : '';").for(val => val == 'your accounts').then(() => {

            this.browser.endInteractive();

        });

        let reloginWatcher = this.browser.watch("var ele = document.getElementsByTagName('H1')[0]; ele ? ele.textContent.trim().toLowerCase() : '';").for(val => val == 'your accounts').then(() => {
            
        });
            
        let loggedInWatcher

        this.browser.execute("document.location.href"}).then(val => {
            if (val.match('relogin')) this.hostInterface.showBrowser();
        });
        loggedInWatcher.cancel();

        */


        return new Promise<void>((resolve, reject) => {

            let code = '';
            if (crn) code += "document.getElementById('main').contentWindow.document.getElementById('crn').value = '" + Utils.javaScriptEscape(crn) + "';";
            if (password) code += "document.getElementById('main').contentWindow.document.getElementById('Password').value = '" + Utils.javaScriptEscape(password) + "';";
            if (crn && password) {
                code += "document.getElementById('main').contentWindow.document.getElementById('SignonButton').click();";
                this.browser.execute(code);
            } else {
                this.browser.startInteractive(); 
                this.browser.onLoadStart().then(ev => {
                    this.browser.endInteractive();
                });
            }                    


            let checker = setInterval(() => {
                this.browser.execute("var ele = document.getElementsByTagName('H1')[0]; ele ? ele.textContent.trim().toLowerCase() : '';").then(val => {                        
                    if (val == 'your accounts') {
                        // TODO: And the browser has stopped loading check (maybe record a browser "idle" ?), and wait for some idle time?, also check on browser finished loading... (the interval will get ajax calls..., not sure if they are triggered by cordova...)
                        // So make a function to encapsulate that logic...
                        this.connected = true;
                        setTimeout(() => resolve(), 500); // Delay for page to render? - Seems to load accounts via ajax calls... need to really wait and check for those! - or wait until loading has stopped for X seconds (ie. page is "stable")
                        clearInterval(checker);
                    } else {
                        this.browser.execute("document.location.href").then(val => {
                            if (val.match('relogin')) {
                                this.browser.startInteractive(); 
                                this.browser.onLoadStart().then(ev => {
                                    this.browser.endInteractive();
                                });
                            }
                        });
                    }
                });
            }, 1000);
        });

    }

    isConnected(): boolean {
        return this.connected;
    }

    getAccounts(): Promise<BankAccount[]> {
        // TODO: make sure on accounts listing page, OR nav to that page
        
        return this.browser.execute('document.getElementsByClassName("normalLayoutAccounts")[0].innerHTML').then((val) => {
            let dom = new DOMParser().parseFromString(val, 'text/html');
            let bankAccounts : BankAccount[] = []; 
            Array.from(dom.getElementsByClassName('listViewAccountWrapperYourAccounts')).forEach(ele => {
                let bankAccount = new BankAccount();
                bankAccount.accountName = ele.getElementsByClassName('accountNameSection')[0].textContent.trim();
                bankAccount.bsb = ele.getElementsByClassName('accountNoSection')[0].textContent.trim().split(' ')[0];
                bankAccount.accountNumber = ele.getElementsByClassName('accountNoSection')[0].textContent.trim().split(' ')[1];
                bankAccount.accountBalance = ele.getElementsByClassName('listViewMobileCurrentBalanceValue')[0].textContent.trim().replace('$','').replace(',','').replace(',','');
                bankAccount.accountAvailableBalance = ele.getElementsByClassName('listViewMobileAvailableBalanceValue')[0].textContent.trim().replace('$','').replace(',','').replace(',','');
                bankAccounts.push(bankAccount);
            });
            return bankAccounts;
        });
    }


    async getTransactions(account: BankAccount): Promise<BankAccountTransaction[]> {
        // TODO: state tracking... At the moment, always click "home", then nav to account (document.getElementById(accountName).click())
        
        // TODO: these shoudl be in a 
        this.browser.execute("document.querySelector('li.menuLiClass:nth-child(1) > a').click();");
        await this.browser.onLoadStop();

        this.browser.execute("document.querySelector('#" + account.accountName.split(' ').join('') + " > a').click();");
        await this.browser.onLoadStop();

        // TODO: Sometimes this fires too soon ?
        this.browser.execute("document.querySelector('.transactionAuthSection > a:nth-child(1)').click();");
        await this.browser.onLoadStop();


        return this.browser.execute('document.getElementsByClassName("tabsContainerAcctTranAuth")[0].innerHTML').then((val) => {
            try {
                return this.parseTransactionPage(val);
            } catch (e) {
                this.logger.info('Error parsing transaction list', e, val);
                throw e;
            }
        });

        /*return this.browser.execute('JSON.stringify(processedTransactionsSingleSet)'}).then((txnList) => {

            JSON.parse(txnList[0]).forEach(txnObj => {
                let bankAccountTransaction = new BankAccountTransaction();
                bankAccountTransaction.description = txnObj.getTxnDesc;
                bankAccountTransaction.amount = txnObj.getTxnAmt;
                bankAccountTransaction.transactionDate = moment().month(txnObj.month).date(txnObj.day).year(txnObj.year).format(Utils.STANDARD_DATE_FORMAT);
                // TODO: Some kind of ordering so we can match / compare next time...

                //txnObj.txnType;
                //txnObj.getTxnBalance;
                bankAccountTransactions.push(bankAccountTransaction);
            });
            return bankAccountTransactions;
        });*/

    }

    private parseTransactionPage(html: string) : BankAccountTransaction[] {
        let bankAccountTransactions : BankAccountTransaction[] = []; 
        let dom = new DOMParser().parseFromString(html, 'text/html');
        Array.from(dom.getElementsByClassName('displayTable')).forEach(ele => {

            let bankAccountTransaction = new BankAccountTransaction();

            bankAccountTransaction.description = ele.querySelector('[class*="desc"]').textContent.trim().split(/\s+/).join(' ');
            bankAccountTransaction.amount = ele.querySelector('.tran-amount-div').textContent.trim().replace("$", "").replace(",", '').replace(',','').replace('+', '');
            bankAccountTransaction.balance = (ele.querySelector('.tran-balance-div').textContent.replace('Balance', '').trim().match(/\S+/g) || [''])[0].replace("$", "").replace(",", '').replace(',','');

            let dateMonthParts = ele.querySelector('.dateNmonthSection').textContent.match(/\S+/g) || [];

            let lastParentElement = ele.parentElement;
            while (lastParentElement.parentElement.getElementsByClassName('monthYearDisplay').length == 0) lastParentElement = lastParentElement.parentElement;
            let previousSibling = lastParentElement.previousElementSibling;
            while (previousSibling && previousSibling.getElementsByClassName('monthYearDisplay').length != 1) previousSibling = previousSibling.previousElementSibling;
            let monthYearParts = previousSibling ? previousSibling.getElementsByClassName('monthYearDisplay')[0].textContent.match(/\S+/g) || [] : [];
            if (monthYearParts.length == 0) monthYearParts = lastParentElement.parentElement.getElementsByClassName('monthYearDisplay')[0].textContent.match(/\S+/g) || [];
            

            if (!bankAccountTransaction.balance && dateMonthParts.length == 2) {

                bankAccountTransaction.status = 'authorised';
                let testDate = moment().month(dateMonthParts[1]).date(Number(dateMonthParts[0]));
                if (testDate.format(Utils.STANDARD_DATE_FORMAT) > moment().format(Utils.STANDARD_DATE_FORMAT)) testDate.subtract(1, 'years');
                bankAccountTransaction.transactionDate = testDate.format(Utils.STANDARD_DATE_FORMAT);

            } else if (dateMonthParts.length == 0 && monthYearParts.length == 1 && monthYearParts[0] == 'Recent') {

                bankAccountTransaction.status = 'recent';
                bankAccountTransaction.transactionDate = null;

            } else if (dateMonthParts.length == 2 && monthYearParts.length == 2) {

                bankAccountTransaction.status = 'processed';
                let dateMonth = moment().month(dateMonthParts[1]).date(Number(dateMonthParts[0]));
                let monthYear = moment().year(Number(monthYearParts[1])).month(monthYearParts[0]);
                if (dateMonth.month() != monthYear.month()) {/* TODO: Error */}
                bankAccountTransaction.transactionDate = dateMonth.year(monthYear.year()).format(Utils.STANDARD_DATE_FORMAT);

            } else {
                // Invalid / Error
                this.logger.info("Unable to determine status and date for transaction", bankAccountTransaction);
            }

            bankAccountTransactions.push(bankAccountTransaction);

        });

        bankAccountTransactions.reverse();
        return bankAccountTransactions;
    }

    async close() {
        // TODO: Logout (if possible) and close the browser object
        // TODO: Host needs to close any open browser objects here and log it if was left dangling
        // TODO: Note: logging out successfully should remove the window listener
        this.browser.execute("document.querySelector('.button-logout').click();");
        await this.browser.onLoadStop();
        this.connected = false;
        // TODO: If Not logged out, then force quit below...
        this.browser.close();

        // Force quit...
        /*
        this.browser.execute('window.onbeforeunload = null;'}).then(() => {
            this.browser.close();
        }, () => {
            this.browser.close();
        });
        return Promise.resolve();
        */
    }

}