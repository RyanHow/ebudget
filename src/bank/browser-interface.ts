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

    interactive: boolean;
    shown: boolean;
    abstract logger: Logger;

    visible(visible?: boolean): boolean {
        return this.interactive || this.shown;
    }

    show() {
        this.shown = true;
        this.visible(true);
    }

    hide() {
        this.shown = false;        
        this.visible(this.interactive);
    }

    startInteractive() {
        this.interactive = true;        
        this.visible(true);
    }

    endInteractive() {
        this.interactive = false;        
        this.visible(this.shown);
    }
    
    navigate(url: string): Promise<any> {
        this.logger.debug("Navigating to " + url);
        return this.execute("window.location='" + encodeURI(url) + "'").then(() => {return this.onLoadStop()});

    }

}