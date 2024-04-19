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
        this.tape = new Uint8Array(this.buffer, 9);  // MAKE DYNAMIC
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
        return 1;
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
        if (Atomics.load(this.flag, 0)) return 1;

        let ptrs = [Atomics.load(this.pointers, 0), Atomics.load(this.pointers, 1)];

        for (; (ptrs[0] < this.script.length) && (!this.opMap[this.script[ptrs[0]]]); ptrs[0]++);
        if (ptrs[0] >= this.script.length) return -1;

        let code = this.opMap[this.script[ptrs[0]]](ptrs);

        Atomics.store(this.pointers, 0, ptrs[0]++);
        
        return code;
    }

    executeN(n) {
        for (let i = 0; i < n; i++) {
            if (execute()) break;
        }
    }

    executeAll() {
        while (true) {
            if (execute()) break;
        }
        this.pointers[0] = 0;
    }
}