export class Observable {
    protected observers: { [name: string]: Function[] } = {};

    public addObserver(event: string, callback: Function) {
        if (!this.observers[event]) this.observers[event] = [];
        this.observers[event].push(callback);
    }

    public removeObserver(event: string, callback: Function) {
        if (this.observers[event]) {
            this.observers[event].splice(this.observers[event].indexOf(callback), 1);
        }
    }

    public fire(event: string, args?: any) {
        if (this.observers[event]) for (const callback of this.observers[event]) callback(args);
    }
}
