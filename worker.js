// Maps chars to its operation
const createOpMap = (bfi) => ({
    ">" : bfi.right,
    "<" : bfi.left,
    "+" : bfi.increment,
    "-" : bfi.decrement,
    "." : bfi.output,
    "," : bfi.input,
    "[" : bfi.loopStart,
    "]" : bfi.loopEnd,
});


class BFInterpreter {
    constructor(config, buffer) {
        this.config = config;
        this.buffer = buffer;
        this.flag = new Int8Array(this.buffer, 0, 1)
        this.pointers = new Uint32Array(this.buffer, 1, 2);  // 0: InstructionPointer, 1: TapePointer
        this.tape = new Uint8Array(this.buffer, 9);  // MAKE DYNAMIC TYPE
        this.loopStack = [];
        this.script = '';
        this.opMap = createOpMap(this);
    }


    right(ptrs) {
        if (ptrs[1] + 1 >= this.tape.length) return;
        Atomics.add(this.pointers, 1, 1);
    }

    left(ptrs) {
        if (ptrs[1] <= 0) return;
        Atomics.sub(this.pointers, 1, 1);
    }

    increment(ptrs) {
        Atomics.add(this.tape, ptrs[1], 1);
    }

    decrement(ptrs) {
        Atomics.sub(this.tape, ptrs[1], 1);
    }

    output(ptrs) {
        postMessage({
            type: "output",
            data: Atomics.load(this.tape, ptrs[1]),
        });
    }

    input(ptrs) {
        postMessage({type: "input"});
        this.stop();
    }

    loopStart(ptrs) {
        if (Atomics.load(this.tape, ptrs[1])) this.loopStack.push(ptrs[0]);
        else for (; (ptrs[0] < this.script.length) && (this.script[ptrs[0]] != "]"); ptrs[0]++);
    }

    loopEnd(ptrs) {
        if (Atomics.load(this.tape, ptrs[1])) ptrs[0] = this.loopStack[this.loopStack.length-1];
        else this.loopStack.pop();
    }


    stop(ptrs) {
        clearInterval(this.interval);
        this.interval = null;
    }

    execute() {
        let ptrs = [Atomics.load(this.pointers, 0), Atomics.load(this.pointers, 1)];
        for (; (ptrs[0] < this.script.length) && (!this.opMap[this.script[ptrs[0]]]); ptrs[0]++);
        if (ptrs[0] >= this.script.length) return 1;
        this.opMap[this.script[ptrs[0]]](ptrs);
        Atomics.store(this.pointers, 0, ptrs[0]++);
        return 0;
    }

    executeN(n) {
        if (this.interval) return;
        let count = 0;
        this.interval = setInterval(() => {
            this.execute();
            count++;
            if (count >= n) this.stop();
        })
    }

    executeAll() {
        if (this.interval) return;
        this.interval = setInterval(this.execute);
    }
}






































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
