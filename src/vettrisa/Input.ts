import Neuron from "./Neuron";

/**
 * The input
 */
export default class Input{

    public readonly neuron: Neuron;
    public weight: number;


    constructor(neuron: Neuron, weight: number) {
        this.neuron = neuron;
        this.weight = weight;
    }
}
