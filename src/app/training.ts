export class TrainingPanel {

    protected progressBar: HTMLElement;
    public progressText: HTMLElement;
    public trainingButton: HTMLButtonElement;

    public constructor(props: { barId: string, trainingButtonId: string }) {
        this.progressBar = document.getElementById(props.barId)!;
        this.trainingButton = document.getElementById(props.trainingButtonId) as HTMLButtonElement;
        this.progressText = document.getElementById("progress")!;

        this.trainingButton.disabled = true;
    }

    public setProgress(value: number, current?: number, of?: number) {
        this.progressBar.style["width"] = (value * 100) + "%"
        if(current && of) this.progressText.textContent = `Progress: ${current} / ${of}`;
    }
}
