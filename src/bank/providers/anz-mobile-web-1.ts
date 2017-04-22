import {ProviderInterface, BankAccount, BankAccountTransaction} from '../provider-interface';
import {HostInterface} from '../host-interface';
import {InAppBrowserObject} from '@ionic-native/in-app-browser';
import {Logger} from '../../services/logger';
import moment from 'moment';
import {Utils} from '../../services/utils'

export class AnzMobileWeb1Provider implements ProviderInterface {

    // TODO: Any kind of settings / setup, or a factory type setup here where we pump out sessions

    // TODO: Inject / get a logger ?
    private logger = Logger.get('AnzMobileWeb1Provider');

    // TODO: Move this to some kind of helper
    browser: InAppBrowserObject;
    connected: boolean;
    hostInterface: HostInterface;

    getName(): string {
        return "ANZ";
    }

    connect(hostInterface: HostInterface): Promise<void> {
        this.browser = hostInterface.provideBrowser('https://www.anz.com/INETBANK/bankmain.asp');
        this.browser.on('loaderror'); // ?
        this.hostInterface = hostInterface;

        return new Promise<void>((resolve, reject) => {
            let subscription = this.browser.on('loadstop').subscribe(ev => {
                subscription.unsubscribe();

                // TODO: Maybe change this to async / await? rather than all this nested promises

                this.browser.executeScript({code: 'document.title'}).then((val) => {
                    this.logger.info(val);

                    this.hostInterface.requestInteraction(); // TODO Show the browser...

                    // TODO: Wait for the user to log in (successfully!)
                    // TODO: Maybe need to code this up as the various states and paths, then write the engine to execute that...
                    // But I do just want to get it working at the moment to test the rest of the system
                    // How to wait ?... poll it with a timer ? - Wait for "Your accounts" page?
                    let checker = setInterval(() => {
                        let ele = document.getElementsByTagName('H1')[0];
                        if (ele && ele.textContent.toLowerCase().match('your accounts')) {
                            // TODO: And the browser has stopped loading, also check on browser finished loading... (the interval will get ajax calls..., not sure if they are triggered by cordova...)
                            // So make a function to encapsulate that logic...
                            this.connected = true;
                            resolve();
                            clearInterval(checker);
                        } else {
                            // TODO: If error, or if browser closed, or if cancelled (how to detect??), or if timeout ?

                        }
                    }, 1000);

                }).catch(err => {
                    this.logger.error(err);
                    reject(err);
                });
            });
        });

    }

    isConnected(): boolean {
        return this.connected;
    }

    getAccounts(): Promise<BankAccount[]> {
        // TODO: make sure on accounts listing page, OR nav to that page
        
        return this.browser.executeScript({code: 'document.getElementsByClassName("normalLayoutAccounts")[0].innerHTML'}).then((val) => {
            let dom = new DOMParser().parseFromString(val, 'text/html');
            let bankAccounts : BankAccount[] = []; 
            Array.from(dom.getElementsByClassName('listViewAccountWrapperYourAccounts')).forEach(ele => {
                let bankAccount = new BankAccount();
                bankAccount.accountName = ele.getElementsByClassName('accountNameSection')[0].textContent.trim();
                bankAccount.bsb = ele.getElementsByClassName('accountNoSection')[0].textContent.trim().split(' ')[0];
                bankAccount.accountNumber = ele.getElementsByClassName('accountNoSection')[0].textContent.trim().split(' ')[1];
                bankAccount.accountBalance = ele.getElementsByClassName('listViewMobileCurrentBalanceValue')[0].textContent.trim().replace('$','').replace(',','').replace(',','');
                bankAccounts.push(bankAccount);
            });
            return bankAccounts;
        });
    }

    waitForLoadingToStop(): Promise<void> {
        return new Promise<void>(resolve => {
            let subscription = this.browser.on('loadstop').subscribe(ev => {
                subscription.unsubscribe();
                resolve();
            });
            // TODO: Errors...
        });
    }

    async getTransactions(account: BankAccount): Promise<BankAccountTransaction[]> {
        // TODO: state tracking... At the moment, always click "home", then nav to account (document.getElementById(accountName).click())
        (<HTMLAnchorElement> document.querySelector('li.menuLiClass:nth-child(1) > a')).click();
        await this.waitForLoadingToStop();

        (<HTMLAnchorElement> document.querySelector('#' + account.accountName.split(' ').join('') + ' > a')).click();
        await this.waitForLoadingToStop();

        let bankAccountTransactions : BankAccountTransaction[] = []; 

        return this.browser.executeScript({code: 'JSON.stringify(processedTransactionsSingleSet)'}).then((txnList) => {

            JSON.parse(txnList).forEach(txnObj => {
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
        });

    }

    close(): Promise<void> {
        // TODO: Logout (if possible) and close the browser object
        // TODO: Host needs to close any open browser objects here and log it if was left dangling
        this.connected = false;
        this.browser.close();
        return Promise.resolve();
    }

}