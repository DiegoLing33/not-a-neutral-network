import Layer from "./Layer";
import Input from "./Input";

export interface NeuronProps {
    layer: Layer;
    previousLayer?: Layer;
}

export default class Neuron {

    protected _layer: Layer;
    protected inputs: Array<Input | number>;

    public constructor({layer, previousLayer}: NeuronProps) {
        this._layer = layer;
        this.inputs = previousLayer ? previousLayer.neurons.map(neuron => new Input(neuron, Math.random() - 0.5)) : [0];
    }

    /**
     * Returns true, if the first layer is neuron
     */
    get $isFirstLayerNeuron() {
        return !(this.inputs[0] instanceof Input)
    }

    /**
     * The sum of everything
     */
    get inputSum(): number {
        return this.inputs.reduce((sum: any, input: any) => {
            return sum as number + input.neuron.value * input.weight;
        }, 0) as number;
    }

    /**
     * Returns the neuron value
     */
    public get value(): number {
        return this.$isFirstLayerNeuron
            ? this.inputs[0] as number
            : this._layer._network.activationFunction(this.inputSum);
    }

    /**
     * Sets the input
     * @param val
     */
    set input(val: any) {
        if (!this.$isFirstLayerNeuron) return;
        this.inputs[0] = val;
    }

    set error(error: any) {
        if (this.$isFirstLayerNeuron) {
            return;
        }

        const wDelta = error * this._layer._network.derivativeFunction(this.inputSum);

        this.inputs.forEach((input: any) => {
            input.weight -= input.neuron.value * wDelta * this._layer._network.learningRate;
            input.neuron.error = input.weight * wDelta;
        });
    }
}
