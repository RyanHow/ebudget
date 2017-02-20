export class ChunkedTask {

    public static execute(executor: (iterator: ChunkedTaskIterator, resolve: (value?: any) => void, reject: (reason?: any) => void) => void, iteratorData?: {progressCallback: (value: number, of?: number) => void}): Promise<any> {
        let p = new Promise((promiseResolve, promiseReject) => {

            let iterator = new ChunkedTaskIterator();
            iterator.setValue(0);
            if (iteratorData) {
                iterator.progressCallback = iteratorData.progressCallback;

            }
            let func = () => executor(
                iterator, 
                (value?: any) => {
                    iterator.end();
                    promiseResolve(value);
                }, 
                (reason?: any) => {
                    iterator.end();
                    promiseReject(reason);
                }
            );

            iterator.setIterateFunction(func);
            
            iterator.start();

        });

        return p;
    }
}

class ChunkedTaskIterator {
    private value;
    private func: (any);
    public iterationCount;
    private iterationStartTime: number;
    private ended: boolean;
    private expectedSize: number;
    
    progressCallback: (value: number, of?: number) => void;

    public end(): void {
        this.ended = true;
    }

    public setValue(value: any): void {
        this.value = value;
    }

    public getValue(): any {
        return this.value;
    }

    public setIterateFunction(func: (any)): void {
        this.func = func;
    }

    public iterateWithValue(value: any) {
        this.setValue(value);
        this.iterate();
    }

    public start() {
        this.execute();
    }

    public iterate() {

        if (!this.needsBreak()) {
            this.execute();
        }
        
        setTimeout(() => {
            this.execute();
            if (this.progressCallback) this.progressCallback(this.value, this.expectedSize);
        }, 5);
    }

    public setExpectedSize(value: number) {
        this.expectedSize = value;
    }

    private execute() {
        this.iterationStartTime = Date.now();

        while (!this.needsBreak() && !this.ended) {
            // TODO: counters
            this.func();

            this.value++;
        }

        if (!this.ended) {
            this.iterate();
        }


    }


    public needsBreak(): boolean {
        return Date.now() - this.iterationStartTime > 50;
    }

    // TODO: Iteration time, iteration count, counter, progress


}

export class ChunkedTaskTest {

    test1() {
        ChunkedTask.execute((iterator, resolve, reject) => {
            let count = 0;
            for (let i = iterator.getValue(); i < 10000000; i++) {
                if (count++ % 1000 === 0) return iterator.iterateWithValue(i);
            }
            resolve();
        });
    }


    test2() {
        ChunkedTask.execute((iterator, resolve, reject) => {
            let i = iterator.getValue();
            if (i > 1000) resolve();
        });
    }


}