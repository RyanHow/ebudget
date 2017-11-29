export interface ProviderRequiresBrowser {
    setBrowser(browser: BrowserInterface);
}

export interface BrowserInterface {
    dispose();
}