import {PredictPanel} from "./app/predict";
import {TrainingPanel} from "./app/training";
import {applyButtons, TrainingButton} from "./app/buttons";
import {VsaUser} from "./server/user";
import {TypesPanel} from "./app/types";
import TrainingPanelScreen from "./app/trainingPanel";
import ConnectionPanel from "./app/connectionPanel";

declare function io(): any;
declare function autocomplete(a: any, b: any): any;

window.onload = () => {

    const socket = io();

    let buttons: TrainingButton[] = [];
    // const buttonsArray = Object.values(buttons);

    const predictPanel = new PredictPanel("results_list");
    const trainingPanel = new TrainingPanel({barId: "trainingBar", trainingButtonId: "train"});
    const connectionPanel = new ConnectionPanel();
    const trainingPanelScreen = new TrainingPanelScreen();
    const typesPanel = new TypesPanel();

    // const OUTPUT_SIZE = buttonsArray.length;

    // UI
    const users: HTMLElement = document.getElementById("users")!;
    const typeInput: HTMLInputElement = document.getElementById("typeInput") as HTMLInputElement;
    const buttonSelect: HTMLButtonElement = document.getElementById("button-select") as HTMLButtonElement;


    let items = ["A", "B"];

    autocomplete(typeInput, items);

    // Free
    const canvas = document.querySelector('#paintField') as HTMLCanvasElement;
    const clearBtn = document.querySelector('#clear') as HTMLButtonElement;
    const trainBtn = document.querySelector('#train') as HTMLButtonElement;
    const predictBtn = document.querySelector('#predict') as HTMLButtonElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const paintField = new Array(400);
    let mouseDown = false;

    let user: VsaUser;

    socket.on("welcome", (u: VsaUser) => {
        user = u;
        // userName.style['color'] = u.color;
        // userName.textContent = `${u.smile} ${u.name}`;
        connectionPanel.setDisplay(false);
    });

    socket.on("progress", (value: number, v: number, of: number) => {
        trainingPanel.trainingButton.disabled = v < of;
        trainingPanel.setProgress(value, v, of);
        trainingPanelScreen.setDisplay(v < of);
    });

    socket.on("buttons", (items: [string, string, number][]) => {
        buttons = applyButtons(items);
        buttons.forEach(button => {
            button.element.onclick = () => {
                socket.emit("addTrainData", button.name, paintField);
                clearField();
            };
        });
    });

    socket.on("types", (types: any) => {
        autocomplete(typeInput, Object.keys(types));
       typesPanel.updateTypes(types).forEach(value => {
           value[1].onclick = () => {
               socket.emit("remember", value[0]);
           };
       });
    });

    socket.on("users", (us: VsaUser[]) => {
        users.innerHTML = "";
        us.forEach(u => {
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.textContent = u.smile + " " + u.name;
            li.style['color'] = u.color;
            if(u.token === user.token) {
                li.style['backgroundColor'] = '#eee';
                li.textContent += ' <-- you'
            }
            users.appendChild(li);
        });
    });

    socket.on("field", (data: string[]) => {
        paintField.push(...data);

        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                const arrayIndex = i * 20 + j;
                drawSquare(i, j, data[arrayIndex] ? data[arrayIndex] : 'white');
            }
        }
    });

    socket.on("line", (x: number, y: number, color: string) => {
        drawSquare(x, y, color);
    });

    socket.on("prediction", (data: any[]) => {
        const results = data;
        const obj: Record<string, any> = {};

        for (let i = 0; i < results.length; i++) {
            obj[data[i][0]] = (Math.round(data[i][1] * 10000) / 100) + "%";
        }
        predictPanel.update(obj, data);
    });

    socket.on("trainEnd", () => {
        trainingPanel.trainingButton.disabled = false;
        trainingPanel.progressText.textContent = "Trained!";
        trainingPanelScreen.setDisplay(false);
    });

    socket.on("clear", () => clearCanvas())

    buttonSelect.onclick = () => {
        const value = typeInput.value;
        socket.emit("remember", value);
        typeInput.value = "";
    };

    function drawGrid() {
        ctx.strokeStyle = '#CCC'

        for (let i = 1; i < 20; i++) {
            ctx.moveTo(0, i * 20);
            ctx.lineTo(400, i * 20);
            ctx.moveTo(i * 20, 0);
            ctx.lineTo(i * 20, 400);
        }

        ctx.stroke();
    }

    function clearCanvas() {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, 400, 400);
        drawGrid();
    }

    function drawSquare(row: any, column: any, color: any) {
        ctx.fillStyle = color;
        ctx.fillRect(column * 20 + 1, row * 20 + 1, 18, 18);
    }

    function draw(event: any) {
        const rowIndex = Math.floor(event.offsetY / 20);
        const columnIndex = Math.floor(event.offsetX / 20);
        const arrayIndex = rowIndex * 20 + columnIndex;
        paintField[arrayIndex] = user.color;

        socket.emit("draw", arrayIndex, rowIndex, columnIndex, user.color);

        const color = paintField[arrayIndex] ? paintField[arrayIndex] : 'white';
        drawSquare(rowIndex, columnIndex, color);

    }

    function clearField() {
        paintField.fill(false);
        clearCanvas()
    }


    document.addEventListener('mousedown', (e) => {
        mouseDown = true;
    });

    document.addEventListener('mouseup', (e) => {
        mouseDown = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!mouseDown) {
            return;
        }
        draw(e);
    });

    clearBtn.addEventListener('click', () => {
        clearField();
        socket.emit("clear");
    });

    predictBtn.addEventListener('click', () => {
        socket.emit("predict", paintField);
    });

    trainBtn.addEventListener('click', () => {
        socket.emit("train");
    });

    clearField();

}
