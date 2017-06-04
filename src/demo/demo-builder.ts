import { DemoRunner } from "./demo-runner";

// TODO: Command alias
export type CommandTypes = 'move' | 'click' | 'wait' | 'type' | 'end';

export interface DemoAction {
 command: CommandTypes;
 args: Array<any>;
}

export class DemoBuilder {

    private q: Array<DemoAction>;
    private demoRunner: DemoRunner;

    constructor() {
        this.q = [];
    }

    queue(command: CommandTypes, ... args: Array<any>) {
        this.q.push({command: command, args: args});
    }

    addErrorHandler(handler: (err) => void) {

    }

    addCompletedHandler(handler: () => void) {

    }

    run(demoRunner: DemoRunner) {
        this.demoRunner = demoRunner;
        this.runAll();
    }

    private runAll() {
        if (this.q.length) { 
            let action = this.q.shift();
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
                return this.demoRunner.moveTo(action.args[0]);
            case 'click':
                return this.demoRunner.click(action.args[0]);
            case 'wait':
                return new Promise(resolve => setTimeout(resolve, action.args[0]));
            case 'type':
                return this.demoRunner.input(action.args[0], action.args[1]);
            case 'end':
                this.demoRunner.dispose();
                return Promise.resolve();
            default: Promise.reject('Invalid command: ' + action.command);
        }

    }
}