let initialized, tapeType, buffer, flag, pointers, tape, loopStack, script;

const tapeTypes = {
    0: Uint8Array,
    1: Int8Array,
    2: Uint16Array,
    3: Int16Array, 
};

// Maps chars to its operation
const opMap = {
    ">" : right,
    "<" : left,
    "+" : increment,
    "-" : decrement,
    "." : output,
    "," : input,
    "[" : loopStart,
    "]" : loopEnd,
    "!" : interrupt, // extra command
};

const messageOps = {
    init: ({tapeType, buffer}) => init(tapeType, buffer),
    step: step,
    run: run,
    setScript: setScript,
    resetInsPtr: resetInsPtr,
    setInsPtr: setInsPtr,
    setTapeVal: ({index, value}) => null,
};

onmessage = ({data: {type, data}}) => messageOps[type](data);

function init(_tapeType, _buffer) {
    tapeType = _tapeType;
    buffer = _buffer;
    flag = new Int32Array(buffer, 0, 1)
    pointers = new Uint32Array(buffer, 4, 2);  // 0: InstructionPointer, 1: TapePointer
    tape = new (tapeTypes[tapeType] || Uint8Array)(buffer, 12);
    loopStack = [];
    script = '';
    initialized = true;
    postMessage({type: "state", data: 1});
}

function right(ptrs) {
    if (ptrs[1] + 1 >= tape.length) return;
    Atomics.add(pointers, 1, 1);
}

function left(ptrs) {
    if (ptrs[1] <= 0) return;
    Atomics.sub(pointers, 1, 1);
}

function increment(ptrs) {
    Atomics.add(tape, ptrs[1], 1);
}

function decrement(ptrs) {
    Atomics.sub(tape, ptrs[1], 1);
}

function output(ptrs) {
    postMessage({
        type: "output",
        data: Atomics.load(tape, ptrs[1]),
    });
    return 4;
}

function input(ptrs) {
    postMessage({type: "input"});
    return 4;
}

function loopStart(ptrs) {
    if (Atomics.load(tape, ptrs[1])) loopStack.push(ptrs[0]);
    else for (; (ptrs[0] < script.length) && (script[ptrs[0]] != "]"); ptrs[0]++);
}

function loopEnd(ptrs) {
    if (Atomics.load(tape, ptrs[1])) ptrs[0] = loopStack[loopStack.length-1];
    else loopStack.pop();
}

function interrupt(ptrs) {
    return 3;
}

function execute() {
    if (Atomics.load(flag, 0)) return 3;

    const ptrs = [Atomics.load(pointers, 0), Atomics.load(pointers, 1)];

    for (; (ptrs[0] < script.length) && (!opMap[script[ptrs[0]]]); ptrs[0]++);
    if (ptrs[0] >= script.length) return 2;

    const code = opMap[script[ptrs[0]]](ptrs);

    Atomics.store(pointers, 0, ++ptrs[0]);
    
    return code || 0;
}

function step() {
    if (!initialized) return;
    postMessage({type: "state", data: 5});
    let code = execute();
    if (code < 3) code = 3;
    postMessage({type: "state", data: code});
}

function run() {
    if (!initialized) return;
    postMessage({type: "state", data: 5});
    let code = 0;
    while (true) {
        code = execute();
        if (code) break;
    }
    if (code == 2) resetInsPtr();
    postMessage({type: "state", data: code});
}

function setScript(_script) {
    script = _script;
    Atomics.store(pointers, 0, 0);
}

function resetInsPtr() {
    Atomics.store(pointers, 0, 0);
    postMessage({type: "state", data: 2});
}

function setInsPtr(v) {
    Atomics.store(pointers, 0, v);
}

