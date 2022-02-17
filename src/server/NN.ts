import Network from "../vettrisa/Network";

export function createNN(OUTPUT_SIZE: number): Network{
    const NN = new Network({inputSize: 400, outputSize: OUTPUT_SIZE});
    NN.learningRate = 0.8;
    return NN
}
