let config;
let buffer;
let tape;
let instructionPointer;
let tapePointer;
let loopStack = [];
let script = '';
let interrupt = false;

onmessage = (event) => {
    switch (event.data.type) {
        case 0:
            init(event.data);
            break;
        case 1:
            setScript(event.data);
            break;
        case 2:
            execute();
            break;
        case 3:
            executeAll();
            break;
    }
}

function init(data) {
    buffer = data.buffer;
}

function setScript(data) {
    script = data;
}

function execute() {

}

function executeAll() {
    while (instructionPointer < script.length) {
        setTimeout(execute());
        if (interrupt) {
            interrupt = false;
            break;
        }
    }
}


/*const config = {initialized: false};
const allowedChars = [">","<","+","-",".",",","[","]"];

onmessage = (event) => {
    if (!config.initialized && event.data.type === "init") {
        config.maxCells = event.data.data.maxCells;
    }
}

message = {
    type: null,
    data: {},
}*/
