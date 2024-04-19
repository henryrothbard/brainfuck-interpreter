// UI //
document.getElementById("outputTerminal").addEventListener("click", (event) => {
    document.getElementById("editableOutput").focus();
});


const BFUIStates = {
    0: ["--svg: var(--env-off-icon); color: hsl(0, 100%, 40%);", "Unavailable"],
    1: ["--svg: var(--env-empty-icon); color: hsl(120, 100%, 40%);", "Empty"],
    2: ["--svg: var(--env-full-icon); color: hsl(120, 100%, 40%);", "Healthy"],
    3: ["--svg: var(--env-paused-icon); color: hsl(40, 100%, 40%);", "Paused"],
    4: ["--svg: var(--env-waiting-icon); color: hsl(40, 100%, 40%); animation: spinning 1s infinite;", "Waiting"],
    5: ["--svg: var(--env-running-icon); color: hsl(40, 100%, 40%); animation: spinning 1s infinite;", "Running"],
};

function setUIState(state) {
    const [style, text] = BFUIStates[state] || ["", ""];
    document.getElementById("envBtn").style = style;
    document.getElementById("envTxt").innerHTML = text;
}

const BFops = new Set([">","<","+","-",".",",","[","]"]);

const BFStates = {
    off: 0,  // BFI is unavailabe or turned off
    empty: 1,  // BFI is blank and contains no data
    full: 2,  // BFI has data in the tape and tape pointer but instruction pointer is set to 0
    paused: 3,  // BFI is paused
    waiting: 4,  // BFI is waiting for input for ',' command
    running: 5,  // BFI is running
};

const BFEnvironment = {
    state: 0,
    config: {},
    worker: null,
    buffer: null,
    views: {
        flag: null,
        pointers: null,
        tape: null,
    },
    updateViews: () => {
        if (!this.buffer) return;
        this.views.flag = new Int8Array(this.buffer, 0, 1);
        this.views.pointers = new Uint32Array(this.buffer, 1, 2);
        this.views.tape = new Uint8Array(this.buffer, 9);
    },
    init: () => {
        if (!this.worker) this.worker = new Worker("worker.js");
        this.buffer = new SharedArrayBuffer((1*30000)+9);
        this.updateViews();
        this.worker.postMessage({type: "init", data: {config: this.config, buffer: this.buffer}});
    },
};

setUIState(0);