

export class TypesPanel{

    public readonly element: HTMLElement;

    constructor() {
        this.element = document.getElementById("types_list")!;
    }

    public updateTypes(types: Record<string, number>){
        this.element.innerHTML = "";
        const tts: any[] = [];
        for(const t of Object.keys(types)){
            const li = document.createElement("li");
            li.className = "list-group-item list-group-item-action";
            const row = document.createElement("div");
            row.className = "row";

            const nameCol = document.createElement("div");
            const valCol = document.createElement("div");
            nameCol.className = "col";
            valCol.className = "col text-end";

            nameCol.textContent = t;
            valCol.textContent = types[t].toString();

            row.appendChild(nameCol);
            row.appendChild(valCol);
            li.appendChild(row);
            this.element.appendChild(li);
            tts.push([t, li]);
        }
        return tts;
    }

}
