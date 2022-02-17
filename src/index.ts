// @ts-ignore
import {Logger} from "@ling.black/log";
import Network from "./vettrisa/Network";

const network = new Network({inputSize: 2, outputSize: 1});
const data = [
    [[0, 0], [0]],
    [[0, 1], [1]],
    [[1, 0], [1]],
    [[1, 1], [0]],
];

network.train(data).then(() => {
    const testData = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
    ];

    testData.forEach((input, index) => {
        network.input = input;
        console.log(`${input[0]} XOR ${input[1]} = ${network.prediction}`)
    });
});
