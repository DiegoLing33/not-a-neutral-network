(function () {
    'use strict';

    /**
     * The input
     */
    class Input {
        constructor(neuron, weight) {
            this.neuron = neuron;
            this.weight = weight;
        }
    }

    class Neuron {
        constructor({ layer, previousLayer }) {
            this._layer = layer;
            this.inputs = previousLayer ? previousLayer.neurons.map(neuron => new Input(neuron, Math.random() - 0.5)) : [0];
        }
        /**
         * Returns true, if the first layer is neuron
         */
        get $isFirstLayerNeuron() {
            return !(this.inputs[0] instanceof Input);
        }
        /**
         * The sum of everything
         */
        get inputSum() {
            return this.inputs.reduce((sum, input) => {
                return sum + input.neuron.value * input.weight;
            }, 0);
        }
        /**
         * Returns the neuron value
         */
        get value() {
            return this.$isFirstLayerNeuron
                ? this.inputs[0]
                : this._layer._network.activationFunction(this.inputSum);
        }
        /**
         * Sets the input
         * @param val
         */
        set input(val) {
            if (!this.$isFirstLayerNeuron)
                return;
            this.inputs[0] = val;
        }
        set error(error) {
            if (this.$isFirstLayerNeuron) {
                return;
            }
            const wDelta = error * this._layer._network.derivativeFunction(this.inputSum);
            this.inputs.forEach((input) => {
                input.weight -= input.neuron.value * wDelta * this._layer._network.learningRate;
                input.neuron.error = input.weight * wDelta;
            });
        }
    }

    class Layer {
        constructor({ neuronsCount, previousLayer, network }) {
            this._network = network;
            this.neurons = [];
            for (let i = 0; i < neuronsCount; i++) {
                this.neurons.push(new Neuron({ layer: this, previousLayer: previousLayer }));
            }
        }
        /**
         * Returns true, if its the first layer
         */
        get $isFirstLayer() {
            return this.neurons[0].$isFirstLayerNeuron;
        }
        /**
         * Sets the input
         * @param val
         */
        set input(val) {
            if (!this.$isFirstLayer)
                return;
            if (!Array.isArray(val))
                return;
            if (val.length !== this.neurons.length)
                return;
            val.forEach((v, i) => this.neurons[i].input = v);
        }
    }

    class Observable {
        constructor() {
            this.observers = {};
        }
        addObserver(event, callback) {
            if (!this.observers[event])
                this.observers[event] = [];
            this.observers[event].push(callback);
        }
        removeObserver(event, callback) {
            if (this.observers[event]) {
                this.observers[event].splice(this.observers[event].indexOf(callback), 1);
            }
        }
        fire(event, args) {
            if (this.observers[event])
                for (const callback of this.observers[event])
                    callback(args);
        }
    }

    class Network extends Observable {
        constructor({ inputSize, outputSize, hiddenLayersCount = 1, learningRate = 0.5 }) {
            super();
            this.activationFunction = Network.sigmoid;
            this.derivativeFunction = Network.sigmoidDerivative;
            this.learningRate = learningRate ?? 0.5;
            this.layers = [this.createLayer({ neuronsCount: inputSize })];
            for (let i = 0; i < hiddenLayersCount ?? 1; i++) {
                const layerSize = Math.min(inputSize * 2 - 1, Math.ceil((inputSize * 2 / 3) + outputSize));
                this.layers.push(this.createLayer({
                    neuronsCount: layerSize,
                    previousLayer: this.layers[this.layers.length - 1],
                }));
            }
            this.layers.push(new Layer({
                neuronsCount: outputSize,
                previousLayer: this.layers[this.layers.length - 1],
                network: this
            }));
        }
        static sigmoid(x) {
            return 1 / (1 + Math.exp(-x));
        }
        static sigmoidDerivative(x) {
            return Network.sigmoid(x) * (1 - Network.sigmoid(x));
        }
        /**
         * Creates the layer
         * @param neuronsCount
         * @param previousLayer
         */
        createLayer({ neuronsCount, previousLayer }) {
            return new Layer({ neuronsCount, previousLayer, network: this });
        }
        set input(val) {
            this.layers[0].input = val;
        }
        get prediction() {
            return this.layers[this.layers.length - 1].neurons.map((neuron) => neuron.value);
        }
        trainOnce(dataSet) {
            if (!Array.isArray(dataSet)) {
                return;
            }
            dataSet.forEach((dataCase) => {
                const [input, expected] = dataCase;
                this.input = input;
                this.prediction.forEach((r, i) => {
                    this.layers[this.layers.length - 1].neurons[i].error = r - expected[i];
                });
            });
        }
        async train(dataSet, epochs = 100000) {
            return new Promise(resolve => {
                console.group('Training');
                console.log('Will train ' + epochs + " epochs");
                console.log('Dataset size: ' + dataSet.length);
                for (let i = 0; i < epochs; i++) {
                    this.trainOnce(dataSet);
                    this.fire("trainEpoch", { index: i, count: epochs });
                }
                console.groupEnd();
                this.fire("trainEnd");
                resolve();
            });
        }
        addTrainEpochObserver(callback) {
            this.addObserver("trainEpoch", callback);
        }
        addTrainEndObserver(callback) {
            this.addObserver("trainEnd", callback);
        }
    }

    class TrainingButton {
        constructor(element) {
            this.element = element;
            this.text = this.element.querySelector("span");
            this.name = this.element.dataset['name'] ?? "undefined";
            console.log('Init button: ' + this.name);
        }
        setText(text) {
            this.text.textContent = text;
            return this;
        }
        getText() {
            return this.text.textContent ?? "";
        }
        disabled(disabled) {
            this.element.disabled = disabled;
            return this;
        }
        onClick(fn) {
            this.element.addEventListener("click", fn);
        }
    }
    function getTrainButtons() {
        const butch = document.getElementById("smiles");
        const items = butch.children;
        const buttons = {};
        for (const item of items) {
            const btn = new TrainingButton(item);
            buttons[btn.name] = btn;
        }
        return buttons;
    }

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
        }
        update(data) {
            this.element.innerHTML = "";
            for (const name of Object.keys(data)) {
                this.element.appendChild(createListItem(name, data[name]));
            }
        }
    }

    class TrainingPanel {
        constructor(props) {
            this.progressBar = document.getElementById(props.barId);
            this.trainingButton = document.getElementById(props.trainingButtonId);
            this.progressText = document.getElementById("progress");
        }
        setProgress(value, current, of) {
            this.progressBar.style["width"] = (value * 100) + "%";
            if (current && of)
                this.progressText.textContent = `Progress: ${current} / ${of}`;
        }
    }

    window.onload = () => {
        const buttons = getTrainButtons();
        const buttonsArray = Object.values(buttons);
        const predictPanel = new PredictPanel("results_list");
        const trainingPanel = new TrainingPanel({ barId: "trainingBar", trainingButtonId: "train" });
        const OUTPUT_SIZE = buttonsArray.length;
        const canvas = document.querySelector('#paintField');
        const clearBtn = document.querySelector('#clear');
        const trainBtn = document.querySelector('#train');
        const predictBtn = document.querySelector('#predict');
        const ctx = canvas.getContext('2d');
        const paintField = new Array(100);
        const trainData = [];
        const NN = new Network({ inputSize: 100, outputSize: OUTPUT_SIZE });
        let mouseDown = false;
        NN.learningRate = 0.8;
        NN.addTrainEpochObserver(args => {
            trainingPanel.trainingButton.disabled = true;
            trainingPanel.setProgress(args.index / args.count, args.index, args.count);
        });
        NN.addTrainEndObserver(() => {
            trainingPanel.trainingButton.disabled = false;
            trainingPanel.setProgress(1, 1000, 1000);
        });
        updatePredictResults();
        function drawGrid() {
            ctx.strokeStyle = '#CCC';
            for (let i = 1; i < 10; i++) {
                ctx.moveTo(0, i * 40);
                ctx.lineTo(400, i * 40);
                ctx.moveTo(i * 40, 0);
                ctx.lineTo(i * 40, 400);
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
            ctx.fillRect(column * 40 + 1, row * 40 + 1, 38, 38);
        }
        function draw(event) {
            const rowIndex = Math.floor(event.offsetY / 40);
            const columnIndex = Math.floor(event.offsetX / 40);
            const arrayIndex = rowIndex * 10 + columnIndex;
            paintField[arrayIndex] = 1;
            const color = paintField[arrayIndex] ? 'green' : 'white';
            drawSquare(rowIndex, columnIndex, color);
        }
        function clearField() {
            paintField.fill(false);
            clearCanvas();
        }
        function updatePredictResults() {
            const results = NN.prediction;
            const obj = {};
            for (let i = 0; i < results.length; i++) {
                obj[buttonsArray[i].name] = (Math.round(results[i] * 10000) / 100) + "%";
            }
            predictPanel.update(obj);
        }
        function storeResult(value) {
            trainData.push([[...paintField], value]);
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
        });
        buttonsArray.forEach((button, index) => {
            button.onClick(() => {
                button.setText((parseInt(button.getText()) + 1).toString());
                const arr = new Array(OUTPUT_SIZE).fill(0);
                arr[index] = 1;
                storeResult(arr);
                clearField();
            });
        });
        predictBtn.addEventListener('click', () => {
            NN.input = [...paintField];
            updatePredictResults();
            // const [happiness, sadness] = NN.prediction;
            //       alert(`I think it's a ${happiness > sadness ? 'happy' : 'sad'} face!\n
            // Happiness: ${Math.round(happiness * 100)}% Sadness: ${Math.round(sadness * 100)}%`);
        });
        trainBtn.addEventListener('click', () => {
            NN.train(trainData, 100).then(() => {
                predictBtn.disabled = false;
                alert('Trained!');
            });
        });
        clearField();
    };

}());
