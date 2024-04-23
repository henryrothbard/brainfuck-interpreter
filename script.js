// I LOVE OOP!!!!!!

if (!crossOriginIsolated) {
    document.getElementById("notSupportedDialog").open = true;
}

class UI {
    static elements = (e => e.reduce((r, i) => (r[i] = document.getElementById(i), r), {}))([
        "envBtn",
        "envTxt",
        "toolBtn0",
        "toolBtn1",
        "toolBtn2",
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
        const layoutFunc = (e => e.matches ? this.collapse() : this.expand()).bind(this);
        layoutFunc(collapseMQ);
        collapseMQ.addEventListener("change", layoutFunc);
    }

    updateFocus(panel) {
        UI.elements.outputPanel.style = "";
        UI.elements.inputPanel.style = "";
        this.panelFocus = panel
        if (this.isCollapsed) {
            if (panel) {
                UI.elements.outputTab.classList.add("active");
                UI.elements.inputTab.classList.remove("active");

            } else {
                UI.elements.outputTab.classList.remove("active");
                UI.elements.inputTab.classList.add("active");
            }
            (this.panelFocus ? UI.elements.inputPanel : UI.elements.outputPanel).style = "display: none;";
        } else {
            UI.elements.outputTab.classList.add("active");
            UI.elements.inputTab.classList.add("active");
        }  
    }

    collapse() {
        this.isCollapsed = true;
        UI.elements.panel1.appendChild(UI.elements.outputPanel);
        UI.elements.p1TabBar.appendChild(UI.elements.outputTab);
        this.updateFocus(this.panelFocus);
    }

    expand() {
        this.isCollapsed = false;
        UI.elements.panel2.appendChild(UI.elements.outputPanel);
        UI.elements.p2TabBar.appendChild(UI.elements.outputTab);
        this.updateFocus(this.panelFocus);
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
// };