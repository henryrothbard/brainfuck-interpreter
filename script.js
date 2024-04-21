// Event Listeners //
document.getElementById("outputTerminal").addEventListener("click", (event) => {
    document.getElementById("editableOutput").focus();
});

class UI {
    static {
        this.elements = {
            envBtn: document.getElementById("envBtn"),
            envTxt: document.getElementById("envTxt"),
            toolBtn0: document.getElementById("toolBtn0"),
            toolBtn1: document.getElementById("toolBtn1"),
            toolBtn2: document.getElementById("toolBtn2"),
        };
        this.envStates = {
            0: ["--svg: var(--env-off-icon); color: hsl(0, 100%, 40%);", "Unavailable"],
            1: ["--svg: var(--env-empty-icon); color: hsl(120, 100%, 40%);", "Empty"],
            2: ["--svg: var(--env-full-icon); color: hsl(120, 100%, 40%);", "Full"],
            3: ["--svg: var(--env-paused-icon); color: hsl(40, 100%, 40%);", "Paused"],
            4: ["--svg: var(--env-waiting-icon); color: hsl(40, 100%, 40%);", "Waiting"],
            5: ["--svg: var(--env-running-icon); color: hsl(40, 100%, 40%); animation: spin 1s infinite;", "Running"],
        };
    }

    constructor() {
        this.setState(0);
    }

    updateEnvBtn(state) {
        [UI.elements.envBtn.style, UI.elements.envTxt.innerHTML] =
        UI.envStates[state] || UI.envStates[0];
    }

    updateToolBtns(state) {
        UI.elements.toolBtn0.style = "--svg: var(--reset-icon)";
        UI.elements.toolBtn1.style = "--svg: var(--play-icon)";
        UI.elements.toolBtn2.style = "--svg: var(--step-icon)";
        if (state >= 3) UI.elements.toolBtn0.style = "--svg: var(--stop-icon)";
        if (state >= 4) UI.elements.toolBtn1.style = "--svg: var(--pause-icon)";
    }

    setState(state) {
        this.updateEnvBtn(state);
        this.updateToolBtns(state);
    }
}

class BFEnv {
    static states = {
        off: 0,  // BFI is unavailabe or turned off
        empty: 1,  // BFI is blank and contains no data
        full: 2,  // BFI has data in the tape and tape pointer but instruction pointer is set to 0
        paused: 3,  // BFI is paused
        waiting: 4,  // BFI is waiting for input for ',' command
        running: 5,  // BFI is running
    };

    static tapeTypes = {
        0: Uint8Array,
        1: Int8Array,
        2: Uint16Array,
        3: Int16Array, 
        // Wanted to use Int32 but "[-]" would run in unreasonable time O(2^n)
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
            this.worker.onmessage = ({data: {type, data}}) => {console.log({type, data}); this.messageTypes[type](data);};
        }
        this.tapeType = tapeType;
        this.buffer = new SharedArrayBuffer((1*30000)+12);
        this.flag = new Int32Array(this.buffer, 0, 1);
        this.pointers = new Uint32Array(this.buffer, 4, 2);
        this.tape = new (BFEnv.tapeTypes[tapeType] || Uint8Array)(this.buffer, 12);
        this.worker.postMessage({type: "init", data: {tapeType: tapeType, buffer: this.buffer}});
    }

    setState(state) {
        this.state = state;
        ui.setState(state);
    }

    executeAll() {
        Atomics.store(this.flag, 0, 0);
        this.continueAfterInput = true;
        this.worker.postMessage({type: "executeAll"});
    }

    step() {
        Atomics.store(this.flag, 0, 0);
        this.continueAfterInput = false;
        this.worker.postMessage({type: "executeN", data: 1});
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
































// const UI = {
//     elements: {

//     },
//     envStatuses: {
//         0: ["--svg: var(--env-off-icon); color: hsl(0, 100%, 40%);", "Unavailable"],
//         1: ["--svg: var(--env-empty-icon); color: hsl(120, 100%, 40%);", "Empty"],
//         2: ["--svg: var(--env-full-icon); color: hsl(120, 100%, 40%);", "Healthy"],
//         3: ["--svg: var(--env-paused-icon); color: hsl(40, 100%, 40%);", "Paused"],
//         4: ["--svg: var(--env-waiting-icon); color: hsl(40, 100%, 40%); animation: spin 1s infinite;", "Waiting"],
//         5: ["--svg: var(--env-running-icon); color: hsl(40, 100%, 40%); animation: spin 1s infinite;", "Running"],
//     },
//     setEnvState: (state) => {
//         [UI.elements.envBtn.style, UI.elements.envTxt.innerHTML] = UI.envStatuses[state] || UI.envStatuses[0];
//     },
//     outputTxt: "",
// };

// const BFops = new Set([">","<","+","-",".",",","[","]"]);

// const BFStates = {
//     off: 0,  // BFI is unavailabe or turned off
//     empty: 1,  // BFI is blank and contains no data
//     full: 2,  // BFI has data in the tape and tape pointer but instruction pointer is set to 0
//     paused: 3,  // BFI is paused
//     waiting: 4,  // BFI is waiting for input for ',' command
//     running: 5,  // BFI is running
// };

// const BFEnvironment = {
//     state: 0,
//     config: {},
//     worker: null,
//     buffer: null,
//     views: {
//         flag: null,
//         pointers: null,
//         tape: null,
//     },
//     updateViews: () => {
//         if (!this.buffer) return;
//         this.views.flag = new Int8Array(this.buffer, 0, 1);
//         this.views.pointers = new Uint32Array(this.buffer, 1, 2);
//         this.views.tape = new Uint8Array(this.buffer, 9);
//     },
//     init: () => {
//         if (!this.worker) this.worker = new Worker("worker.js");
//         this.buffer = new SharedArrayBuffer((1*30000)+9);
//         this.updateViews();
//         this.worker.postMessage({type: "init", data: {config: this.config, buffer: this.buffer}});
//     },

// };

// UI.setEnvState(0);