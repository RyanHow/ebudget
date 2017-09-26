import { DemoUI } from "./demo-ui";
import { DemoSetup } from "./demo-setup";

// TODO: Command alias
export type CommandTypes = 'move' | 'click' | 'wait' | 'type' | 'end' | 'reset' | 'loop';

export interface DemoAction {
 command: CommandTypes;
 args: Array<any>;
}

export class DemoPlayer {
    demoSetup: DemoSetup;

    private actionList: Array<DemoAction>;
    private actionListCurrentLine: number;
    private setupScript: Array<any>;
    private demoUI: DemoUI;

    constructor() {
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

    setup(demoSetup: DemoSetup): Promise<void> {
        this.demoSetup = demoSetup;
        return this.demoSetup.setup(this.setupScript);
    }

    run(demoUI: DemoUI) {
        this.demoUI = demoUI;
        this.actionListCurrentLine = 0;
        this.runAll();
    }

    private runAll() {
        if (this.actionListCurrentLine < this.actionList.length) { 
            let action = this.actionList[this.actionListCurrentLine];
            this.actionListCurrentLine++;
            this.executeAction(action).then(() => {
                this.runAll();
            }).catch(reason => {
            
            });
        } else {
            // TODO: Some kind of end notification

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
            case 'loop':
                this.actionListCurrentLine = 0;
                return this.demoSetup.reset().then(() => this.demoSetup.setup(this.setupScript));
            case 'end':
                this.demoUI.dispose();
                return Promise.resolve();
            default: Promise.reject('Invalid command: ' + action.command);
        }

    }
}