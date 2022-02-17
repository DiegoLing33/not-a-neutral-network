export function applyButtons(items: [string, string, number][]) {
    const butch: HTMLElement = document.getElementById("smiles")!;
    butch.innerHTML = "";
    const buttons: TrainingButton[] = [];
    for (const item of items) {
        console.log(item);
        const button = new TrainingButton(item[0], item[1]);
        button.setText(item[2].toString());
        buttons.push(button);
        butch.appendChild(button.element);
    }

    return buttons;
}

export class TrainingButton {

    public readonly element: HTMLButtonElement;
    protected text: string = "";
    public readonly name: string;
    public readonly smile: string;

    constructor(name: string, smile: any) {
        this.element = document.createElement("button");
        this.element.className = "btn btn-primary";
        this.name = name;
        this.smile = smile;
        this.setText("0");
        console.log('Init button: ' + this.name);
    }

    public setText(text: string) {
        this.text = text;
        this.element.textContent = `${this.smile} ${this.text}`;
        return this;
    }

    public getText(): string {
        return this.text;
    }

    public disabled(disabled: boolean) {
        this.element.disabled = disabled;
        return this;
    }

    public onClick(fn: Function) {
        this.element.addEventListener("click", fn as any);
    }

}
