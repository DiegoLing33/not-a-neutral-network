function createListItem(name: string, value: string) {
    const li = document.createElement("li");
    li.className = "list-group-item";

    const row = document.createElement("div");
    row.className = "row";

    const nameCol = document.createElement("div");
    nameCol.className = "col";
    nameCol.textContent = name;

    const valueCol = document.createElement("div");
    valueCol.className = "col text-end";
    valueCol.textContent = value;

    row.appendChild(nameCol);
    row.appendChild(valueCol);
    li.appendChild(row);
    return li;
}

export class PredictPanel {

    protected element: HTMLElement;
    protected alert: HTMLElement;

    public constructor(id: string) {
        this.element = document.getElementById(id)!;
        this.alert = document.getElementById("alert")!;
    }

    public update(data: Record<string, any>, raw: any) {
        this.element.innerHTML = "";
        for (const name of Object.keys(data)) {
            this.element.appendChild(createListItem(name, data[name]));
        }


        this.alert.innerHTML = "I think it's <b>" + raw.sort((a: any, b: any) => b[1] - a[1])[0][0] + "</b>";
    }

}
