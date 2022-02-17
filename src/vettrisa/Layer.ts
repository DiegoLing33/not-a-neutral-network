import Neuron from "./Neuron";
import Network from "./Network";

export interface LayerProps{
    neuronsCount: number
    previousLayer?: Layer;
    network: Network;
}

export default class Layer {
    public _network: Network;
    public neurons: Neuron[];

    constructor({neuronsCount, previousLayer, network}: LayerProps ) {
        this._network = network;
        this.neurons = [];

        for (let i = 0; i < neuronsCount; i++) {
            this.neurons.push(new Neuron({layer : this, previousLayer : previousLayer}));
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
    set input(val: any) {
        if (!this.$isFirstLayer) return;
        if (!Array.isArray(val)) return;
        if (val.length !== this.neurons.length) return;

        val.forEach((v, i) => this.neurons[i].input = v);
    }
}
