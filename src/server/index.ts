// @ts-ignore
import express, {Request, Response} from "express";
// @ts-ignore
import http from "http";

// @ts-ignore
import path from "path";
import {Socket} from "socket.io";
import {createNN} from "./NN";
import {getRandomUniqueUser, USERS} from "./user";
import * as fs from "fs";

declare var __dirname: string;

const SAVE_FILE = path.resolve(__dirname, "static/data.json");

const app = express();
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

const SAVED = loadData();

let BUTTONS = SAVED.buttons ?? [
    ["happy", "🙂", 0],
    ["sad", "🙁", 0],
    ["heart", "❤️", 0],
];

let TYPES = SAVED.types ?? {smile: 0, sad: 0};

const OUTPUT_SIZE = Object.keys(TYPES).length;
const EPOCHS = 10;

const paintField = new Array(400);
const dataField = new Array(400);

dataField.fill(0);

let NN = createNN(OUTPUT_SIZE);
let trainData: any[] = SAVED.data ?? [];

NN.addTrainEpochObserver(args => {
    io.emit("progress", args.index / args.count, args.index, args.count);
});

NN.addTrainEndObserver(() => {
    io.emit("progress", 1, 1, 1);
});


function getDataIndex(name: string) {
    let indexData = 0;
    for (let i = 0; i < BUTTONS.length; i++) {
        if (BUTTONS[i][0] === name) {
            indexData = i;
            break;
        }
    }
    return indexData;
}

function sendUsers() {
    io.emit("users", Object.values(USERS));
}

function clearCanvas() {
    dataField.fill(0);
    paintField.fill(0);

    io.emit("field", paintField);
}

function save() {
    fs.writeFileSync(SAVE_FILE, JSON.stringify(
        {data: trainData, buttons: BUTTONS, types: TYPES}
    ));
}

function loadData() {
    if (fs.existsSync(SAVE_FILE)) {
        return JSON.parse(String(fs.readFileSync(SAVE_FILE)));
    }
    return {data: undefined, buttons: undefined, types: undefined};
}

function train(){
    save();
    NN.train(trainData, EPOCHS).then(() => {
        io.emit("trainEnd");
    })
}

function predict(){
    NN.input = [...dataField];
    const results = NN.prediction;
    const res: [string, number][] = [];
    for (let i = 0; i < Object.keys(TYPES).length; i++) {
        res.push([Object.keys(TYPES)[i], results[i]]);
    }
    io.emit("prediction", res);
}

let timeout: any = null;

function throttle(){
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        predict();
    }, 600);
}

app.use(express.static(path.resolve(__dirname, 'static')));

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "static/index.html"));
});

server.listen(8100, () => {
    console.log('listening on *:8100');
});



io.on('connection', (socket: Socket) => {
    const user = getRandomUniqueUser();
    console.log(`[${user.token}]: connected`);


    socket.on("disconnect", () => {
        console.log(`[${user.token}]: disconnected and entity is free`);
        delete USERS[user.token];
        sendUsers();
    });

    socket.on("draw", (index: number, row: number, col: number) => {
        dataField[index] = 1;
        paintField[index] = user.color;
        io.emit("line", row, col, user.color);
        // throttle();
        // io.emit("field", paintField);
    });


    socket.on("clear", () => {
        clearCanvas();
    });

    socket.on("remember", (type: string) => {

        if (TYPES[type] === undefined) {
            TYPES[type] = 0;
            const SIZE = Object.keys(TYPES).length;
            console.log(`[${user.token}]: added type [${type}]`);
            NN = createNN(SIZE);
            for(let i = 0; i < trainData.length; i++){
                let item = trainData[i];
                if(item[1].length < SIZE){
                    for(let k = item.length; k < SIZE; k++){
                        trainData[i][1].push(0);
                    }
                }
            }
            NN.addTrainEpochObserver(args => {
                io.emit("progress", args.index / args.count, args.index, args.count);
            });

            NN.addTrainEndObserver(() => {
                io.emit("progress", 1, 1, 1);
            });
            train();
        }
        TYPES[type] = TYPES[type] + 1;
        console.log(`[${user.token}]: added to ${type}'s`);


        const arr = new Array(Object.keys(TYPES).length).fill(0);
        arr[Object.keys(TYPES).indexOf(type)] = 1;
        if(dataField.every(v => !v)) {
            console.log("empty");
            return;
        }
        trainData.push([[...dataField], arr]);
        io.emit("types", TYPES);
        clearCanvas();

    });

    socket.emit("welcome", user);
    socket.emit("types", TYPES);
    socket.emit("field", paintField);
    sendUsers();


    socket.emit("buttons", BUTTONS);
    socket.emit("progress", 1, 1, 1);

    socket.on("addTrainData", (name: string) => {
        const dataIndex = getDataIndex(name);
        console.log('received new data [' + name + "] index: " + dataIndex);
        const arr = new Array(OUTPUT_SIZE).fill(0);
        arr[dataIndex] = 1;
        BUTTONS[dataIndex][2] = BUTTONS[dataIndex][2] as number + 1;
        trainData.push([[...dataField], arr]);
        io.emit("buttons", BUTTONS);
        clearCanvas();
    });

    socket.on("predict", () => {
       predict();
    });

    socket.on("train", () => {
        train();
    });

});


