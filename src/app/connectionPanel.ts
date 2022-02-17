export default class ConnectionPanel {

    public readonly element: HTMLElement;

    constructor() {
        this.element = document.getElementById("message")!;
    }

    public setDisplay(value: boolean) {
        this.element.style['display'] = value ? 'flex' : 'none';
    }

}

