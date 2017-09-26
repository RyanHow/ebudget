export class Autofocus {

    private _enabled: boolean = true;

    public get enabled(): String {
        return this._enabled ? '' : null;
    }

    public setEnabled(enabled: boolean) {
        this._enabled = enabled;
    }
}