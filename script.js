const worker = new Worker("worker.js");
const buffer = new SharedArrayBuffer(100);
const view = new Uint8Array(buffer);
worker.postMessage(buffer);
console.log("SharedArrayBuffer");

setTimeout(() => {console.log(Atomics.load(view, 0))}, 1)



/*
class BrainfuckInterpreter {
    constructor(script = "", max_cells = 30000) {
        this.script = this.cleanScript(script);
        this.array = [0];
        this.max_cells = max_cells;  // if set to zero there is no limit
        this.instructionPointer = 0;
        this.dataPointer = 0;
        this.stringToOperation = {
            ">" : this.right,
            "<" : this.left,
            "+" : this.increment,
            "-" : this.decrement,
            "." : this.output,
            "," : this.input,
            "[" : this.loopStart,
            "]" : this.loopEnd,
        }
    }

    cleanScript(script) {
        const allowedChars = [">","<","+","-",".",",","[","]"];
        let cleanScript = "";
        for (let i = 0; i < script.length; i++) {
            if (allowedChars.includes(script[i])) cleanScript += script[i];
        }
        return cleanScript;
    }

    right() {
        this.dataPointer++;
        if (this.dataPointer === this.array.length) this.array.push(0);
    }

    left() {
        this.dataPointer--;
        this.popAllZeros();
    }

    increment() {
        this.array[this.dataPointer]++;
        if (this.array[this.dataPointer] > 255) this.array[this.dataPointer] = 0;
    }

    decrement() {
        this.array[this.dataPointer]--;
        if (this.array[this.dataPointer] < 0) this.array[this.dataPointer] = 255;
    }

    output() {}
    input() {}
    loopStart() {}
    loopEnd() {}
    
    // removes unnecessary zeros //unnecessary code
    popAllZeros() {
        for (let i = this.array.length - 1; i > this.dataPointer; i--) {
            if (this.array[i] === 0) this.array.pop();
            else break;
        }
    }
}

//use web workers; add config;*/