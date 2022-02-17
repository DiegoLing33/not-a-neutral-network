export default class TrainingPanelScreen {

    public readonly element: HTMLElement;

    constructor() {
        this.element = document.getElementById("training")!;
    }

    public setDisplay(value: boolean) {
        this.element.style['display'] = value ? 'flex' : 'none';
    }

}
