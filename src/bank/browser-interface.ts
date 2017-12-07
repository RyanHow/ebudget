import { Logger } from "../services/logger";

export interface ProviderRequiresBrowser {
    setBrowser(browser: BrowserInterface);
}

export abstract class BrowserInterface {
    abstract execute(javascript: string): Promise<any>;
    abstract onLoadStop(): Promise<void>;
    abstract onLoadStart(): Promise<void>;

    // These should be handled by the bank sync to do any cleanup / cancelling the flow
    abstract onClose(): Promise<void>;
    abstract onLoadError(): Promise<void>;

    abstract close();
    abstract isLoading();

    abstract updateVisbility();

    interactive: boolean;
    shown: boolean;
    abstract logger: Logger;

    visible(): boolean {
        return this.interactive || this.shown;
    }

    userShow() {
        this.shown = true;
        this.updateVisbility();
    }

    userHide() {
        this.shown = false;        
        this.updateVisbility();
    }

    startInteractive() {
        this.interactive = true;        
        this.updateVisbility();
    }

    endInteractive() {
        this.interactive = false;        
        this.updateVisbility();
    }
    
    navigate(url: string): Promise<void> {
        this.logger.debug("Navigating to " + url);
        return this.execute("window.location='" + encodeURI(url) + "'")
        .then(() => this.onLoadStop())
        .then(() => this.logger.debug("Navigated to " + url));

    }

    sleep(millis: number): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, millis);
        });
    }

}