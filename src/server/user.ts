import {pickRandom} from "../utils/array";

const md5 = require("md5");

const SMILES = [
    "🕵🏻", "‍👮🏼‍♂️", "🧟‍♂️", "🙎🏼‍♀️", "🦄", "🐤", "🦒"
];

const NAMES = [
    "Lyaguha", "Prikolist", "Coolman", "Teacher", "Ted", "Tim", "Marker", "Painter", "Lolkek", "Pitor", "Sam"
];

const COLORS = ["#ff0000",
    "#00aa00",
    "#0000ff",
    "#aaaa00",
    "#aaffaa",
    "#aaaaff",
    "#6495ED",
    "#800080",
    "#ffaaff"];

export interface VsaUser {
    name: string;
    color: string;
    smile: string;
    token: string;
}

export const USERS: Record<string, VsaUser> = {};

export const __createRandomUser = (): VsaUser => {
    const smile = pickRandom(SMILES);
    const name = pickRandom(NAMES);
    const color = pickRandom(COLORS);
    const token = md5(smile + name + color);
    return {
        smile, name, color, token
    }
}

export const getRandomUniqueUser = (): VsaUser => {
    let user = __createRandomUser();
    do {
        user = __createRandomUser();
    } while (Object.keys(USERS).includes(user.token) || Object.values(USERS).find(v => v.color === user.color));
    USERS[user.token] = user;
    return user;
};
