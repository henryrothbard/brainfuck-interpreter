// Maps chars to its operation
const createOpMap = (bfi) => ({
    ">" : bfi.right.bind(bfi),
    "<" : bfi.left.bind(bfi),
    "+" : bfi.increment.bind(bfi),
    "-" : bfi.decrement.bind(bfi),
    "." : bfi.output.bind(bfi),
    "," : bfi.input.bind(bfi),
    "[" : bfi.loopStart.bind(bfi),
    "]" : bfi.loopEnd.bind(bfi),
});

class BFInterpreter {
    static tapeTypes = {
        0: Uint8Array,
        1: Int8Array,
        2: Uint16Array,
        3: Int16Array,
    };

    constructor() {
        this.initialized = false;
    }

    init(tapeType, buffer) {
        this.tapeType = tapeType;
        this.buffer = buffer;
        this.flag = new Int32Array(this.buffer, 0, 1)
        this.pointers = new Uint32Array(this.buffer, 4, 2);  // 0: InstructionPointer, 1: TapePointer
        this.tape = new (BFInterpreter.tapeTypes[tapeType] || Uint8Array)(this.buffer, 12);
        this.loopStack = [];
        this.script = '';
        this.opMap = createOpMap(this);
        this.initialized = true;
        postMessage({type: "state", data: 1});
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
        return 4;
    }

    loopStart(ptrs) {
        if (Atomics.load(this.tape, ptrs[1])) this.loopStack.push(ptrs[0]);
        else for (; (ptrs[0] < this.script.length) && (this.script[ptrs[0]] != "]"); ptrs[0]++);
    }

    loopEnd(ptrs) {
        if (Atomics.load(this.tape, ptrs[1])) ptrs[0] = this.loopStack[this.loopStack.length-1] || -1;
        else this.loopStack.pop();
    }

    execute() {
        if (Atomics.load(this.flag, 0)) return 3;

        let ptrs = [Atomics.load(this.pointers, 0), Atomics.load(this.pointers, 1)];

        for (; (ptrs[0] < this.script.length) && (!this.opMap[this.script[ptrs[0]]]); ptrs[0]++);
        if (ptrs[0] >= this.script.length) return 2;

        let code = this.opMap[this.script[ptrs[0]]](ptrs);

        Atomics.store(this.pointers, 0, ++ptrs[0]);
        
        return code || 0;
    }

    step() {
        if (!this.initialized) return;
        postMessage({type: "state", data: 5});
        code = this.execute();
        if (code < 3) code = 3;
        postMessage({type: "state", data: code});
    }

    run() {
        if (!this.initialized) return;
        postMessage({type: "state", data: 5});
        let code = 0;
        while (true) {
            code = this.execute();
            if (code) break;
        }
        if (code == 2) this.resetInsPtr();
        postMessage({type: "state", data: code});
    }

    setScript(script) {
        this.script = script;
        Atomics.store(this.pointers, 0, 0);
    }

    resetInsPtr() {
        Atomics.store(this.pointers, 0, 0);
        postMessage({type: "state", data: 2});
    }
}
const bfi = new BFInterpreter();

const messageOps = {
    init: ({tapeType, buffer}) => bfi.init(tapeType, buffer),
    step: bfi.step.bind(bfi),
    run: bfi.run.bind(bfi),
    setScript: bfi.setScript.bind(bfi),
    resetInsPtr: bfi.resetInsPtr.bind(bfi),
};

onmessage = ({data: {type, data}}) => messageOps[type](data);