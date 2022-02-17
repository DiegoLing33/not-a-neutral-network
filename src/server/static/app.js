(function () {
    'use strict';

    function createListItem(name, value) {
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
    class PredictPanel {
        constructor(id) {
            this.element = document.getElementById(id);
            this.alert = document.getElementById("alert");
        }
        update(data, raw) {
            this.element.innerHTML = "";
            for (const name of Object.keys(data)) {
                this.element.appendChild(createListItem(name, data[name]));
            }
            this.alert.innerHTML = "I think it's <b>" + raw.sort((a, b) => b[1] - a[1])[0][0] + "</b>";
        }
    }

    class TrainingPanel {
        constructor(props) {
            this.progressBar = document.getElementById(props.barId);
            this.trainingButton = document.getElementById(props.trainingButtonId);
            this.progressText = document.getElementById("progress");
            this.trainingButton.disabled = true;
        }
        setProgress(value, current, of) {
            this.progressBar.style["width"] = (value * 100) + "%";
            if (current && of)
                this.progressText.textContent = `Progress: ${current} / ${of}`;
        }
    }

    function applyButtons(items) {
        const butch = document.getElementById("smiles");
        butch.innerHTML = "";
        const buttons = [];
        for (const item of items) {
            console.log(item);
            const button = new TrainingButton(item[0], item[1]);
            button.setText(item[2].toString());
            buttons.push(button);
            butch.appendChild(button.element);
        }
        return buttons;
    }
    class TrainingButton {
        constructor(name, smile) {
            this.text = "";
            this.element = document.createElement("button");
            this.element.className = "btn btn-primary";
            this.name = name;
            this.smile = smile;
            this.setText("0");
            console.log('Init button: ' + this.name);
        }
        setText(text) {
            this.text = text;
            this.element.textContent = `${this.smile} ${this.text}`;
            return this;
        }
        getText() {
            return this.text;
        }
        disabled(disabled) {
            this.element.disabled = disabled;
            return this;
        }
        onClick(fn) {
            this.element.addEventListener("click", fn);
        }
    }

    class TypesPanel {
        constructor() {
            this.element = document.getElementById("types_list");
        }
        updateTypes(types) {
            this.element.innerHTML = "";
            const tts = [];
            for (const t of Object.keys(types)) {
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

    class TrainingPanelScreen {
        constructor() {
            this.element = document.getElementById("training");
        }
        setDisplay(value) {
            this.element.style['display'] = value ? 'flex' : 'none';
        }
    }

    class ConnectionPanel {
        constructor() {
            this.element = document.getElementById("message");
        }
        setDisplay(value) {
            this.element.style['display'] = value ? 'flex' : 'none';
        }
    }

    window.onload = () => {
        const socket = io();
        let buttons = [];
        // const buttonsArray = Object.values(buttons);
        const predictPanel = new PredictPanel("results_list");
        const trainingPanel = new TrainingPanel({ barId: "trainingBar", trainingButtonId: "train" });
        const connectionPanel = new ConnectionPanel();
        const trainingPanelScreen = new TrainingPanelScreen();
        const typesPanel = new TypesPanel();
        // const OUTPUT_SIZE = buttonsArray.length;
        // UI
        const users = document.getElementById("users");
        const typeInput = document.getElementById("typeInput");
        const buttonSelect = document.getElementById("button-select");
        let items = ["A", "B"];
        autocomplete(typeInput, items);
        // Free
        const canvas = document.querySelector('#paintField');
        const clearBtn = document.querySelector('#clear');
        const trainBtn = document.querySelector('#train');
        const predictBtn = document.querySelector('#predict');
        const ctx = canvas.getContext('2d');
        const paintField = new Array(400);
        let mouseDown = false;
        let user;
        socket.on("welcome", (u) => {
            user = u;
            // userName.style['color'] = u.color;
            // userName.textContent = `${u.smile} ${u.name}`;
            connectionPanel.setDisplay(false);
        });
        socket.on("progress", (value, v, of) => {
            trainingPanel.trainingButton.disabled = v < of;
            trainingPanel.setProgress(value, v, of);
            trainingPanelScreen.setDisplay(v < of);
        });
        socket.on("buttons", (items) => {
            buttons = applyButtons(items);
            buttons.forEach(button => {
                button.element.onclick = () => {
                    socket.emit("addTrainData", button.name, paintField);
                    clearField();
                };
            });
        });
        socket.on("types", (types) => {
            autocomplete(typeInput, Object.keys(types));
            typesPanel.updateTypes(types).forEach(value => {
                value[1].onclick = () => {
                    socket.emit("remember", value[0]);
                };
            });
        });
        socket.on("users", (us) => {
            users.innerHTML = "";
            us.forEach(u => {
                const li = document.createElement("li");
                li.className = "list-group-item";
                li.textContent = u.smile + " " + u.name;
                li.style['color'] = u.color;
                if (u.token === user.token) {
                    li.style['backgroundColor'] = '#eee';
                    li.textContent += ' <-- you';
                }
                users.appendChild(li);
            });
        });
        socket.on("field", (data) => {
            paintField.push(...data);
            for (let i = 0; i < 20; i++) {
                for (let j = 0; j < 20; j++) {
                    const arrayIndex = i * 20 + j;
                    drawSquare(i, j, data[arrayIndex] ? data[arrayIndex] : 'white');
                }
            }
        });
        socket.on("line", (x, y, color) => {
            drawSquare(x, y, color);
        });
        socket.on("prediction", (data) => {
            const results = data;
            const obj = {};
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
        socket.on("clear", () => clearCanvas());
        buttonSelect.onclick = () => {
            const value = typeInput.value;
            socket.emit("remember", value);
            typeInput.value = "";
        };
        function drawGrid() {
            ctx.strokeStyle = '#CCC';
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
        function drawSquare(row, column, color) {
            ctx.fillStyle = color;
            ctx.fillRect(column * 20 + 1, row * 20 + 1, 18, 18);
        }
        function draw(event) {
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
            clearCanvas();
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
    };

}());
