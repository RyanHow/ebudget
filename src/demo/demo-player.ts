import { DemoUI } from "./demo-ui";
import { DemoSetup } from "./demo-setup";

// TODO: Command alias
export type CommandTypes = 'move' | 'click' | 'wait' | 'type' | 'end' | 'reset' | 'loop' | 'hide-pointer' | 'show-pointer';
export type StateTypes = 'uninitialised' | 'error' | 'ready' | 'stopped' | 'running' | 'processing' | 'paused';

export interface DemoAction {
 command: CommandTypes;
 args: Array<any>;
}

export class DemoPlayer {
    pausing: boolean;
    currentAction: Promise<void>;
    demoSetup: DemoSetup;

    private actionList: Array<DemoAction>;
    private actionListCurrentLine: number;
    private setupScript: Array<any>;
    private demoUI: DemoUI;
    private _state: StateTypes;
    
    private stateChangeListener: Array<(state: StateTypes) => void> = [];

    private setState(value: StateTypes) {
        if (this._state == value) return;
        this._state = value;
        this.stateChangeListener.forEach(l => l(this._state));
    }

    get state(): StateTypes {
        return this._state;
    }

    onStateChange(listener: (state: StateTypes) => void) {
        this.stateChangeListener.push(listener);
    }

    constructor(demoUI: DemoUI, demoSetup: DemoSetup) {
        this.demoUI = demoUI;
        this.demoSetup = demoSetup;
        this._state = 'uninitialised';
        this.actionList = [];
    }


    example = {
        setup: [
            ['eval', 'some code here'],
            ['eval', 'asyncCall()']
        ],       
        queue: [
            ['move', ''],
            ['click', ''],
        ]
    }

    buildFrom(o: any) {
        o.queue.forEach((line: Array<any>) => {
            this.actionList.push({command: line[0], args: line.length > 1 ? line.slice(1) : []});
        })
        this.setupScript = o.setup;
    }

    queue(command: CommandTypes, ... args: Array<any>) {
        this.actionList.push({command: command, args: args});
    }

    addErrorHandler(handler: (err) => void) {

    }

    addCompletedHandler(handler: () => void) {

    }

    setup(): Promise<void> {
        if (this.state != 'uninitialised') throw new Error('Illegal state for setup ' + this.state); 
        this.setState('processing');
        return this.demoSetup.setup(this.setupScript).then(() => {this.setState('ready')});
    }

    run() {
        if (this.state != 'ready' && this.state != 'paused') throw new Error('Illegal state for run ' + this.state); 
        let fromPaused = this.state == 'paused';
        this.setState('processing');
        this.pausing = false;
        if (!fromPaused) {
            this.actionListCurrentLine = 0;
            this.demoUI.showPointer();
            this.demoUI.resetInterrupt();
        }
        this.setState('running');
        this.runAll();
    }

    stop() {
        if (this.state != 'ready' && this.state != 'running' && this.state != 'paused') throw new Error('Illegal state for stop ' + this.state); 
        this.setState('processing');
        this.demoUI.hidePointer();
        this.demoUI.interrupt();
        this.setState('stopped');
    }

    pause() {
        if (this.state != 'running') throw new Error('Illegal state for pause ' + this.state); 
        this.setState('processing');
        this.pausing = true;
        this.currentAction.then(() => this.setState('paused'));
    }

    reset() {
        if (this.state != 'ready' && this.state != 'stopped' && this.state != 'paused') throw new Error('Illegal state for reset ' + this.state); 
        this.setState('processing');
        return this.demoSetup.reset().then(() => {this.setState('ready')});
    }

    clear() {
        if (this.state != 'ready' && this.state != 'stopped' && this.state != 'paused') throw new Error('Illegal state for clear ' + this.state); 
        this.setState('processing');
        return this.demoSetup.clear().then(() => {this.setState('uninitialised')});
    }

    private runAll() {
        if (this.state == 'stopped' || this.pausing) return;

        if (this.actionListCurrentLine < this.actionList.length) { 
            let action = this.actionList[this.actionListCurrentLine];
            this.actionListCurrentLine++;
            this.currentAction = this.executeAction(action).then(() => {
                this.runAll();
            }).catch(reason => {
                this.setState('error');
            });
        } else {
            // TODO: Some kind of end notification
            this.stop();
        }

    }

    private executeAction(action: DemoAction): Promise<any> {
        switch (action.command) {
            case 'move':
                return this.demoUI.moveTo(action.args[0]);
            case 'click':
                return this.demoUI.click(action.args[0]);
            case 'wait':
                return new Promise(resolve => setTimeout(resolve, action.args[0]));
            case 'type':
                return this.demoUI.input(action.args[0], action.args[1]);
            case 'reset':
                return this.demoSetup.reset();
            case 'hide-pointer':
                return this.demoUI.hidePointer();
            case 'show-pointer':
                return this.demoUI.showPointer();
            case 'loop':
                this.actionListCurrentLine = 0;
                return this.demoSetup.reset();
            default: Promise.reject('Invalid command: ' + action.command);
        }

    }
}