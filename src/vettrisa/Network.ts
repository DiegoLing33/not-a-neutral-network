import Layer from "./Layer";
import {Observable} from "./events/Observers";

export interface NetworkProps {
    inputSize: number;
    outputSize: number;
    hiddenLayersCount?: number;
    learningRate?: number;
}

export default class Network extends Observable {

    public activationFunction: (x: number) => number;
    public derivativeFunction: (x: number) => number;
    public learningRate: number;
    public layers: Layer[];

    static sigmoid(x: number) {
        return 1 / (1 + Math.exp(-x));
    }

    static sigmoidDerivative(x: number) {
        return Network.sigmoid(x) * (1 - Network.sigmoid(x));
    }

    constructor({inputSize, outputSize, hiddenLayersCount = 1, learningRate = 0.5}: NetworkProps) {
        super();
        this.activationFunction = Network.sigmoid;
        this.derivativeFunction = Network.sigmoidDerivative;
        this.learningRate = learningRate ?? 0.5;

        this.layers = [this.createLayer({neuronsCount: inputSize})];

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

    /**
     * Creates the layer
     * @param neuronsCount
     * @param previousLayer
     */
    public createLayer({neuronsCount, previousLayer}: { neuronsCount: number, previousLayer?: Layer }): Layer {
        return new Layer({neuronsCount, previousLayer, network: this});
    }

    set input(val: any) {
        this.layers[0].input = val;
    }

    get prediction() {
        return this.layers[this.layers.length - 1].neurons.map((neuron) => neuron.value);
    }

    trainOnce(dataSet: any) {
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

    public async train(dataSet: any, epochs = 100000): Promise<void> {
        return new Promise<void>(resolve => {
            console.group('Training');
            console.log('Will train ' + epochs + " epochs");
            console.log('Dataset size: ' + dataSet.length);
            for (let i = 0; i < epochs; i++) {
                this.trainOnce(dataSet);
                this.fire("trainEpoch", {index: i, count: epochs});
            }
            console.groupEnd();
            this.fire("trainEnd");
            resolve();
        });
    }

    public addTrainEpochObserver(callback: (args: { index: number, count: number }) => void) {
        this.addObserver("trainEpoch", callback);
    }

    public addTrainEndObserver(callback: Function) {
        this.addObserver("trainEnd", callback);
    }
}
