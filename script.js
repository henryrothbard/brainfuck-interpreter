if (!crossOriginIsolated) document.getElementById("notSupportedDialog").open = true;

const elements = (e => e.reduce((r, i) => (r[i] = document.getElementById(i), r), {}))([
    "content",
    "panel1",
    "panel2",
    "p1TabBar",
    "p2TabBar",
    "inputPanel",
    "outputTab",
    "outputPanel",
    "staticOutput",
    "editableOutput",
]);

const tapeTypes = {
    0: Uint8Array,
    1: Int8Array,
    2: Uint16Array,
    3: Int16Array, 
    // Wanted to use Int32 but "-[-]" would run in unreasonable time O(2^n)
};

const messageTypes = {
    state: setState,
    input: () => {},
    output: pushOutput,
};

let state = 0, 
tapeType = 0, 
cellCount = 30000, 
worker, buffer, flag, pointers, tape, 
outputs = [], 
continueAfterInput = false;

{
    elements.outputPanel.addEventListener("click", () => elements.editableOutput.focus());
    const collapseMQ = window.matchMedia("(max-width: 768px)");
    const layoutFunc = (e => collapse(e.matches))
    layoutFunc(collapseMQ);
    collapseMQ.addEventListener("change", layoutFunc); 
}

function focusOutput(v) {
    elements.content.classList.toggle("output", v);
}

function collapse(v) {
    elements.content.classList.toggle("collapsed", v)
    if (v) {
        elements.panel1.appendChild(elements.outputPanel);
        elements.p1TabBar.appendChild(elements.outputTab);
    } else {
        elements.panel2.appendChild(elements.outputPanel);
        elements.p2TabBar.appendChild(elements.outputTab);
    }
}

function init(_tapeType, _cellCount) {
    if (!worker) {
        worker = new Worker("worker.js");
        worker.onmessage = ({data: {type, data}}) => {
            console.log({type, data}); messageTypes[type](data);
        };
    } else stop();
    tapeType = _tapeType;
    cellCount = _cellCount;
    buffer = new SharedArrayBuffer(((1 << (tapeType >> 1)) * cellCount) + 12);
    flag = new Int32Array(buffer, 0, 1);
    pointers = new Uint32Array(buffer, 4, 2);
    tape = new (tapeTypes[tapeType] || Uint8Array)(buffer, 12);
    outputs = [];
    worker.postMessage({type: "init", data: {tapeType, buffer}});
}

function setState(_state) {
    state = _state;
    document.body.setAttribute("state", state);
    elements.inputPanel.contentEditable = (state < 3).toString();
    elements.editableOutput.contentEditable = (state == 4).toString();
    //if (state < 3) elements.inputPanel.innerHTML = elements.inputPanel.textContent; else
    if (state < 5) {
        const insPtr = Atomics.load(pointers, 0) - 1; // to subtract 1 or to not
        const txt = elements.inputPanel.textContent;
        elements.inputPanel.innerHTML = txt.substring(0, insPtr) + 
        `<span class="insPtrChar" contenteditable="false">${txt.charAt(insPtr)}</span>` + 
        txt.substring(insPtr+1);
    }
}

function pushOutput(v) {
    outputs.push(v);
}

function run() {
    if (state < 3) sendScript(elements.inputPanel.textContent);
    Atomics.store(flag, 0, 0);
    continueAfterInput = true;
    worker.postMessage({type: "run"});
}

function step() {
    if (state < 3) sendScript(elements.inputPanel.textContent);
    Atomics.store(flag, 0, 0);
    continueAfterInput = false;
    worker.postMessage({type: "step"});
}

function resetInsPtr() {
    worker.postMessage({type: "resetInsPtr"});
}

function pause() {
    Atomics.store(flag, 0, 1);
}

function stop() {
    pause();
    resetInsPtr();
}

function shutdown() {
    worker.terminate();
    worker = null;
    setState(0);
}

function sendScript(script) {
    worker.postMessage({type: "setScript", data: script});
}

function tBtn0() {
    if (state >= 3) stop();
    else init(tapeType, cellCount);
}

function tBtn1() {
    if (state >= 4) pause();
    else run();
}

init(tapeType, cellCount);






























/*
class UI {
    static elements = (e => e.reduce((r, i) => (r[i] = document.getElementById(i), r), {}))([
        "envBtn",
        "envTxt",
        "toolBtn0",
        "toolBtn1",
        "toolBtn2",
        "content",
        "panel1",
        "panel2",
        "p1TabBar",
        "p2TabBar",
        "inputTab",
        "outputTab",
        "inputPanel",
        "outputPanel",
        "staticOutput",
        "editableOutput",
    ]);
    
    static envStates = {
        0: ["--svg: var(--env-off-icon); color: hsl(0, 100%, 40%);", "Unavailable"],
        1: ["--svg: var(--env-empty-icon); color: hsl(120, 100%, 40%);", "Blank"],
        2: ["--svg: var(--env-full-icon); color: hsl(120, 100%, 40%);", "Full"],
        3: ["--svg: var(--env-paused-icon); color: hsl(40, 100%, 40%);", "Paused"],
        4: ["--svg: var(--env-waiting-icon); color: hsl(40, 100%, 40%);", "Waiting"],
        5: ["--svg: var(--env-running-icon); color: hsl(40, 100%, 40%); animation: spin 1s infinite;", "Running"],
    };

    constructor() {
        this.setState(0);
        this.isCollapsed = false;
        this.panelFocus = 0; // 0: input panel, 1: output panel
        this.outputType = 0;
        UI.elements.outputPanel.addEventListener("click", () => UI.elements.editableOutput.focus());
        const collapseMQ = window.matchMedia("(max-width: 768px)");
        const layoutFunc = (e => this.collapse(e.matches)).bind(this);
        layoutFunc(collapseMQ);
        collapseMQ.addEventListener("change", layoutFunc);
    }

    focusOutput(v) {
        UI.elements.content.classList.toggle("output", v);
    }

    collapse(v) {
        UI.elements.content.classList.toggle("collapsed", v)
        if (v) {
            UI.elements.panel1.appendChild(UI.elements.outputPanel);
            UI.elements.p1TabBar.appendChild(UI.elements.outputTab);
        } else {
            UI.elements.panel2.appendChild(UI.elements.outputPanel);
            UI.elements.p2TabBar.appendChild(UI.elements.outputTab);
        }
    }

    setState(state) {
        document.body.setAttribute("state", state)
    }

    // TO DO: cursor resets everytime function is called
    updateInput() {
        let e = UI.elements.inputPanel;
        e.innerHTML = e.textContent.replace(/[^><+\-.,\[\]]/g, m => `<span class="nonOpText">${m}</span>`);
    }

    updateOutput(outputs) {

    }
}

class BFEnv {
    static tapeTypes = {
        0: Uint8Array,
        1: Int8Array,
        2: Uint16Array,
        3: Int16Array, 
        // Wanted to use Int32 but "-[-]" would run in unreasonable time O(2^n)
    };

    constructor() {
        this.setState(0);
        this.messageTypes = {
            state: this.setState.bind(this),
            input: () => {},
            output: () => {},
        };
        this.init(0);
    }

    init(tapeType) {
        if (!this.worker) {
            this.worker = new Worker("worker.js");
            this.worker.onmessage = ({data: {type, data}}) => {
                console.log({type, data}); this.messageTypes[type](data);
            };
        }
        this.tapeType = tapeType;
        this.buffer = new SharedArrayBuffer((1*30000)+12);
        this.flag = new Int32Array(this.buffer, 0, 1);
        this.pointers = new Uint32Array(this.buffer, 4, 2);
        this.tape = new (BFEnv.tapeTypes[tapeType] || Uint8Array)(this.buffer, 12);
        this.outputs = [];
        this.worker.postMessage({type: "init", data: {tapeType: tapeType, buffer: this.buffer}});
    }

    setState(state) {
        this.state = state;
        ui.setState(state);
    }

    executeAll() {
        Atomics.store(this.flag, 0, 0);
        this.continueAfterInput = true;
        this.worker.postMessage({type: "run"});
    }

    step() {
        Atomics.store(this.flag, 0, 0);
        this.continueAfterInput = false;
        this.worker.postMessage({type: "step"});
    }

    resetInsPtr() {
        this.worker.postMessage({type: "resetInsPtr"});
    }

    pause() {
        Atomics.store(this.flag, 0, 1);
        this.setState(3)
    }

    stop() {
        this.pause();
        this.resetInsPtr();
    }

    shutdown() {
        this.worker.terminate();
        this.worker = null;
        this.setState(0);
    }

    sendScript(script) {
        this.worker.postMessage({type: "setScript", data: script});
    }
}

const ui = new UI();
const bfe = new BFEnv();


// -- Unused --
// states = {
//     off: 0,  // BFI is unavailabe or turned off
//     empty: 1,  // BFI is blank and contains no data
//     full: 2,  // BFI has data in the tape and tape pointer but instruction pointer is set to 0
//     paused: 3,  // BFI is paused
//     waiting: 4,  // BFI is waiting for input for ',' command
//     running: 5,  // BFI is running
// };*/