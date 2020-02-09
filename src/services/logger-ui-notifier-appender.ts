import {BuildInfo} from '../app/build-info';
import {LoggerAppender, Logger} from './logger';
import {LoggerStorageAppender} from './logger-storage-appender';

export interface LoggerUINotifierAppenderHandler {
    handle(message: string);
}

declare var Device: any;

class DefaultLoggerUINotifierAppenderHandler implements LoggerUINotifierAppenderHandler {

    private errorOverlayDiv: HTMLDivElement;
    private errorStyle: HTMLStyleElement;

    private css = `
        #error-overlay {
            position: fixed;
            z-index: 100000;
            top: 10px;
            bottom: 10px;
            left: 10px;
            right: 10px;
            box-sizing: border-box;
            color: white;
            white-space: nowrap;
            font-size: 20px;
        }

        @media (min-width: 600px) and (min-height: 600px) {
            #error-overlay {
                top: 15%;
                bottom: 15%;
                left: 15%;
                right: 15%;
            }
        }
        
        #error-overlay:after {
            content: '';
            display: block;
            position: absolute;
            background-color: red;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: -1;
            box-shadow: 0 0 30px black;
        }
        #error-overlay:before {
            content: '';
            display: block;
            position: fixed;
            background-color: rgba(100,0,0,0.7);
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: -1;
        }
        #error-overlay-nav {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        }
        #error-overlay .error-page {
            display: inline-block;
            width: 100%;
            height: 100%;
            position: relative;
            white-space: normal;
            left: 0;
        }
        #error-overlay .error-page-animating {
            transition: left 0.3s;
        }
        #error-overlay .header {
            height: 70px;
            width: 100%;
            position: absolute;
            top: 0;
            text-align: center;
            background-color: white;
            color: red;
            white-space: nowrap;
            overflow: hidden;
        }
        #error-overlay .content {
            position: absolute;
            top: 70px;
            bottom: 100px;
            left: 0;
            right: 0;
            box-sizing: border-box;
            overflow: auto;
            padding: 20px;
        }
        #error-overlay .sad-icon {
            font-size: 40px;
            display: inline-block;
            width: 60px;
            height: 60px;
            transform: rotate(90deg);
            margin-top:-20px;
        }
        #error-overlay .error-buttons {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: auto;
            transition: height 0.3s;
        }
        #error-overlay .error-buttons .error-link {
            padding-left: 20px;
            border-top: 1px white solid;
            line-height: 40px;
            cursor: pointer;
            font-size: 14px;
        }
        #error-overlay .error-button {
            position: relative;
            display: block;
            top: 0;
            width: 100%;
            height: 50px;
            line-height: 50px;
            white-space: nowrap;
            font-weight: bold;
            font-size: 20px;
            text-align: center;
            border-top: 1px white solid;
            cursor: pointer;
            transition: opacity 0.3s, top 0.3s;
            color: white;
            text-decoration: none;
        }
        #error-overlay .error-button:hover {
            background-color: rgba(255,255,255,0.2);
        }
        #error-overlay .error-button-disabled:hover, #error-overlay .error-button-disabled {
            cursor: auto;
            background-color: #ccc;
            color: #aaa;
        }
        #error-overlay .error-button-hidden {
            position: relative;
            top: 20px;
            opacity: 0;
            height: 0;
        }
        #error-contact-page label {
            display: block;
            margin-top: 20px;
        }
        #error-contact-page textarea {
            font-size: inherit;
            display: block;
            width: 100%;
            color: black;
            margin-top: 20px;
        }
        #error-contact-page input {
            vertical-align:middle;
            width: 30px;
            height: 30px;
        }
        #error-overlay #error-log-data {
            white-space: pre;
            font-size: 16px;
            font-family: monospace;
        }
        #error-overlay .success-icon {
            font-size: 150px;
            line-height: 150px;
            height: 150px;
            text-align: center;
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            margin-top: -75px;
        }
    `;

    private html = `
        <div id="dismiss-confirm-page" class="error-page">
            <div class="header">
                <h1>Are You Sure?</h1>
            </div>
            <div class="content">
                <div>We really don't recommend ignoring any errors, but sometimes you just have to try and get on with it, we understand.</div>
            </div>
            <div class="error-buttons">
                <div id="dismiss-confirm-back-button" class="error-button">&lt; Go Back</div>
                <div id="dismiss-confirm-button" class="error-link">Close</div>
            </div>
        </div>
        <div id="error-main-page" class="error-page">
            <div class="header">
                <h1><div class="sad-icon">: (</div></h1>
            </div>
            <div class="content">
                <div>Uh Oh! Something has gone terribly wrong. To make sure your budget isn't affected, we've stopped things here.</div>
                <br>
                <div>The best thing to do is send us some information about what has gone wrong so we can get busy fixing it. And if it keeps happening, to give you some support to get your budget up and running again.</div>
            </div>
            <div class="error-buttons" style="height:90px">
                <div id="goto-error-report-button" class="error-button">Next &gt;</div>
                <div id="show-other-options-button" class="error-link">Other Options</div>
                <div id="restart-button" class="error-button error-button-hidden">Restart App</div>
                <div id="dismiss-button" class="error-button error-button-hidden">Ignore</div>
            </div>
        </div>
        <div id="error-contact-page" class="error-page">
            <div class="header">
                <h1>Can we get in touch?</h1>
            </div>
            <div class="content">
                <label>Contact Information
                    <textarea id="error-contact-info" placeholder="eg. me@email.com, a phone number and timezone/time to call, Skype, Hangouts, Facebook, etc."></textarea>
                </label>
                <label><input type="checkbox" id="error-do-not-contact"></input> Do not contact me</label>                
            </div>
            <div class="error-buttons">
                <div id="error-contact-next-button" class="error-button">Next &gt;</div>
                <div id="error-contact-back-button" class="error-link">&lt; Go Back</div>
            </div>
        </div>
        <div id="error-privacy-page" class="error-page">
            <div class="header">
                <h1>Privacy</h1>
            </div>
            <div class="content">
                Unlike most companies, we don't want to collect all your information for marketing. We just want to keep you as a satisfied customer and build the best budgeting app possible.
                <br/><br/>
                This is the information that will be sent to help us sort out the issue.
                <br/><br/>
                Privacy is of the highest priority to us and we won't use this information for anything but solving your issue. This information will be destroyed afterwards.
                <br/><br/>
                <div id="error-report-data"></div>
            </div>
            <div class="error-buttons">
                <div id="error-privacy-next-button" class="error-button">Next &gt;</div>
                <div id="error-privacy-back-button" class="error-link">&lt; Go Back</div>
            </div>
        </div>
        <div id="error-send-page" class="error-page">
            <div class="header">
                <h1>Submit</h1>
            </div>
            <div class="content">
                <div id="error-log-data"></div>
            </div>
            <div class="error-buttons">
                <div id="error-send-button" class="error-button">Submit</div>
                <div id="error-send-back-button" class="error-link">&lt; Go Back</div>
            </div>
        </div>
        <div id="error-sent-page" class="error-page">
            <div class="header">
                <h1>Thanks</h1>
            </div>
            <div class="content">
                <div class="success-icon">&#10004;</div>
            </div>
            <div class="error-buttons" style="height:90px">
                <div id="sent-restart-button" class="error-button">Restart App</div>
                <div id="sent-dismiss-button" class="error-link">Dismiss & Continue (Not recommended)</div>
            </div>
        </div>
        <div id="error-error-page" class="error-page">
            <div class="header">
                <h1>Oh Dear</h1>
            </div>
            <div class="content">
                We couldn't send the error report. Would you mind either emailing it to us, or copying it into an email and sending to support@freedombudgetapp.com
            </div>
            <div class="error-buttons" style="height:140px">
                <a id="error-email-button" data-rel="external" href="mailto:support@freedombudgetapp.com?subject=Error Repprt&body=" class="error-button">Send Using Email</a>
                <div id="error-restart-button" class="error-button">Restart App</div>
                <div id="error-dismiss-button" class="error-link">Dismiss & Continue (Not recommended)</div>
            </div>
        </div>
    `;

    private errorMainPage: HTMLElement;
    private errorContactPage: HTMLElement;
    private errorPrivacyPage: HTMLElement;
    private errorSendPage: HTMLElement;
    private dismissConfirmPage: HTMLElement;
    private errorErrorPage: HTMLElement;
    private errorSentPage: HTMLElement;
    private enableContactNext: boolean;

    private navigating: boolean;

    private errorLogData: string;

    handle(message: string) {
        if (document.getElementById('error-overlay')) return;

        this.populateErrorLogData();

        let errorOverlayWrapperDiv = document.createElement('div');
        errorOverlayWrapperDiv.id = 'error-overlay';
        document.body.insertBefore(errorOverlayWrapperDiv, document.body.firstChild);

        this.errorOverlayDiv = document.createElement('div');
        this.errorOverlayDiv.id = 'error-overlay-nav';
        errorOverlayWrapperDiv.appendChild(this.errorOverlayDiv);
        this.errorOverlayDiv.innerHTML = this.html;

        this.errorMainPage = document.getElementById('error-main-page');
        this.errorContactPage = document.getElementById('error-contact-page');
        this.errorPrivacyPage = document.getElementById('error-privacy-page');
        this.errorSendPage = document.getElementById('error-send-page');
        this.dismissConfirmPage = document.getElementById('dismiss-confirm-page');
        this.errorErrorPage = document.getElementById('error-error-page');
        this.errorSentPage = document.getElementById('error-sent-page');

        this.errorStyle = document.createElement('style');
        this.errorStyle.id = 'error-style';
        this.errorStyle.innerText = this.css;
        document.head.appendChild(this.errorStyle);

        document.getElementById('show-other-options-button').addEventListener('click', ev => {
            document.getElementById('show-other-options-button').remove();
            document.getElementById('dismiss-button').className = 'error-button';
            document.getElementById('restart-button').className = 'error-button';
            document.getElementById('restart-button').parentElement.style.height = '150px';
        });
        document.getElementById('goto-error-report-button').addEventListener('click', ev => {
            this.goToPage(this.errorContactPage);
        });
        document.getElementById('dismiss-button').addEventListener('click', ev => {
            this.goToPage(this.dismissConfirmPage);
        });
        document.getElementById('restart-button').addEventListener('click', ev => {
            this.restartApp();
        });
        document.getElementById('error-dismiss-button').addEventListener('click', ev => {
            this.closeError();
        });
        document.getElementById('error-restart-button').addEventListener('click', ev => {
            this.restartApp();
        });
        document.getElementById('sent-dismiss-button').addEventListener('click', ev => {
            this.closeError();
        });
        document.getElementById('sent-restart-button').addEventListener('click', ev => {
            this.restartApp();
        });

        document.getElementById('dismiss-confirm-button').addEventListener('click', ev => {
            this.closeError();
        });
        document.getElementById('dismiss-confirm-back-button').addEventListener('click', ev => {
            this.goBack(this.errorMainPage);
        });
        document.getElementById('error-contact-next-button').addEventListener('click', ev => {
            if (!this.enableContactNext) {
                // TODO: Some feedback
                return;
            }
            window.localStorage.setItem('error-contact-info', (<HTMLTextAreaElement> document.getElementById('error-contact-info')).value);
            window.localStorage.setItem('error-do-not-contact', (<HTMLInputElement> document.getElementById('error-do-not-contact')).checked ? 'true' : 'false');
            this.goToPage(this.errorPrivacyPage);
        });
        document.getElementById('error-privacy-next-button').addEventListener('click', ev => {
            this.goToPage(this.errorSendPage);
            document.getElementById('error-log-data').innerText = this.getErrorReportData();
        });
        document.getElementById('error-contact-back-button').addEventListener('click', ev => {
            this.goBack(this.errorMainPage);
        });
        document.getElementById('error-privacy-back-button').addEventListener('click', ev => {
            this.goBack(this.errorContactPage);
        });
        document.getElementById('error-send-back-button').addEventListener('click', ev => {
            this.goBack(this.errorPrivacyPage);
        });
        document.getElementById('error-send-button').addEventListener('click', ev => {
            document.getElementById('error-send-button').innerText = 'Sending...';
            document.getElementById('error-send-button').className = 'error-button error-button-disabled';
            this.submitErrorReportData();
        });

        (<HTMLTextAreaElement> document.getElementById('error-contact-info')).value = window.localStorage.getItem('error-contact-info');
        (<HTMLInputElement> document.getElementById('error-do-not-contact')).checked = window.localStorage.getItem('error-do-not-contact') === 'true';

        (<HTMLInputElement> document.getElementById('error-do-not-contact')).addEventListener('change', ev => { this.validateContactInfo(); });
        (<HTMLInputElement> document.getElementById('error-contact-info')).addEventListener('input', ev => { this.validateContactInfo(); });

        this.validateContactInfo();        

        for (let i = this.errorOverlayDiv.children.length - 1; i >= 0; i--) {
            this.errorOverlayDiv.children.item(i).remove();
        }

       this.errorOverlayDiv.appendChild(this.errorMainPage);
    }

    restartApp() {
//        if (Device && <any> Device.cordova) {
            // If native, put up a message and say the app will now close, please open it again and retry.
//            if ((<any>navigator).app) {
//                (<any>navigator).app.exitApp();
//            } else if ((<any>navigator).device) {
//                (<any>navigator).device.exitApp();
//            } else {
//                window.close();
//            }

            // TODO: Message: The application has not closed, please force quit for app, and reopen it.
//        } else {
            // TODO: Reload the original URL used to open it.... need to save that somewhere!?
            document.location.reload(true);
//        }
    }

    closeError() {
        document.getElementById('error-overlay').remove();
        this.errorStyle.remove();
    }

    validateContactInfo() {
        this.enableContactNext = ((<HTMLInputElement> document.getElementById('error-do-not-contact')).checked || (<HTMLTextAreaElement> document.getElementById('error-contact-info')).value.length > 0);
        document.getElementById('error-contact-next-button').className = this.enableContactNext ? 'error-button' : 'error-button error-button-disabled';
    }

    goToPage(page: HTMLElement) {
        if (this.navigating) return;
        this.navigating = true;

        let currentPage = <HTMLElement> this.errorOverlayDiv.getElementsByClassName('error-page').item(0);

        this.errorOverlayDiv.appendChild(page);

        setTimeout(() => {
            page.classList.add('error-page-animating');
            currentPage.classList.add('error-page-animating');
            currentPage.style.left = '-100%';
            page.style.left = '-100%';
            setTimeout(() => {
                currentPage.remove();
                page.style.left = '0';
                page.classList.remove('error-page-animating');
                currentPage.classList.remove('error-page-animating');
                this.navigating = false;
            }, 500);
        });
    }

    goBack(page: HTMLElement) {
        if (this.navigating) return;
        this.navigating = true;

        let currentPage = <HTMLElement> this.errorOverlayDiv.getElementsByClassName('error-page').item(0);

        page.style.left = '-100%';
        currentPage.style.left = '-100%';

        this.errorOverlayDiv.insertBefore(page, currentPage);
        setTimeout(() => {
            page.classList.add('error-page-animating');
            currentPage.classList.add('error-page-animating');
            currentPage.style.left = '0';
            page.style.left = '0';
            setTimeout(() => {
                currentPage.remove();
                page.classList.remove('error-page-animating');
                currentPage.classList.remove('error-page-animating');
                this.navigating = false;
            }, 500);
        });
    }

    populateErrorLogData() {
        this.errorLogData = LoggerStorageAppender.appenders.get('default').stringDump();
    }

    getErrorHeaderData(): Object {
        return {
            'time' : new Date().toISOString(),
            'userAgent' : navigator.userAgent,
            'platform' : navigator.platform,
            'version' : BuildInfo.version,
//            'devicePlatform' : Device && Device.platform ? Device.platform : 'undefined',
//            'deviceModel' : Device && Device.model ? Device.model : 'undefined',
//            'deviceVersion' : Device && Device.version ? Device.version : 'undefined',
//            'deviceNative' : Device && Device.cordova ? Device.cordova : 'undefined',
            'contactInfo' : 'true' === localStorage.getItem('error-do-not-contact') ? 'Do Not Contact' : localStorage.getItem('error-contact-info')
        };

    }

    getErrorReportData(): string {
        let data = '';
        let headerData = this.getErrorHeaderData();
        Object.keys(headerData).forEach(key => {data += key + ':' + headerData[key] + '\n'; });
        data += '\n' + this.errorLogData;
        return data;
    }

    submitErrorReportData() {
        var xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = ev => {  
            if (xmlhttp.readyState === 4) {  
                if (xmlhttp.status === 200) {
                    this.goToPage(this.errorSentPage);
                } else {  
                    this.goToPage(this.errorErrorPage);
                    let errorReportData = this.getErrorReportData();
                    if (errorReportData.length > 20000) errorReportData = errorReportData.substr(0, 20000);
                    (<HTMLLinkElement> document.getElementById('error-email-button')).href += encodeURIComponent(errorReportData.split('\n').join('\\n'));
                }  
            }  
        }; 

        xmlhttp.onerror = ev => {
            this.goToPage(this.errorErrorPage);
            let errorReportData = this.getErrorReportData();
            if (errorReportData.length > 20000) errorReportData = errorReportData.substr(0, 20000);
            (<HTMLLinkElement> document.getElementById('error-email-button')).href += encodeURIComponent(errorReportData.split('\n').join('\\n'));
        };

        xmlhttp.open('POST', 'https://api.ebudget.live/submiterror');
        xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        let data = this.getErrorHeaderData();
        data['log'] = this.errorLogData;
        xmlhttp.send(JSON.stringify(data));

    }
}

export class LoggerUINotifierAppender implements LoggerAppender {

    public static instance: LoggerUINotifierAppender = new LoggerUINotifierAppender();
    private _handler: LoggerUINotifierAppenderHandler;

    public get handler(): LoggerUINotifierAppenderHandler {
        return this._handler || this.defaultHandler;
    }

    public set handler(value: LoggerUINotifierAppenderHandler) {
        this._handler = value;
    }

    private defaultHandler: LoggerUINotifierAppenderHandler = new DefaultLoggerUINotifierAppenderHandler();

    constructor() {
        LoggerUINotifierAppender.instance = this;
    }

     log (level: number, data: any[]) {

        if (level !== Logger.ERROR) return;

        let message = data.length > 0 ? Logger.stringValue(data[0]) : 'Log';

        if (this.handler) {
            try {
                this.handler.handle(message);
            } catch (e) {
                this.defaultHandler.handle(message);
            }
        } else {
            this.defaultHandler.handle(message);
        }

     }
}

