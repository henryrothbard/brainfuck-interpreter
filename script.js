if (!crossOriginIsolated) document.getElementById("notSupportedDialog").open = true;

const tapeTypes = {
    0: Uint8Array,
    1: Int8Array,
    2: Uint16Array,
    3: Int16Array, 
    // Wanted to use Int32 but "-[-]" would run in unreasonable time O(2^n)
};

const messageTypes = {
    state: setState,
    input: requestInput,
    output: pushOutput,
};

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

let state = 0, 
tapeType = 0, 
cellCount = 30000, 
worker, buffer, flag, pointers, tape, continueAfterInput,
outputs = [];

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
            messageTypes[type](data);
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
    elements.staticOutput.innerHTML = "";
    elements.editableOutput.innerHTML = "";
    elements.editableOutput.contentEditable = "false";
}

// NOT MY CODE
function clearHighlights() {
    const highlights = elements.inputPanel.querySelectorAll('.insPtrChar');
    highlights.forEach(span => {
        const parent = span.parentNode;
        parent.insertBefore(document.createTextNode(span.textContent), span);
        parent.removeChild(span);
    });
}

function highlightChar(index) {
    clearHighlights();
    let currentCount = 0;
    let nodeStack = [elements.inputPanel], node, found = false;

    while (nodeStack.length > 0 && !found) {
        node = nodeStack.pop();
        if (node.nodeType === 3) {
            if (currentCount + node.length > index) {
                let span = document.createElement('span');
                span.className = 'insPtrChar';
                span.textContent = node.textContent[index - currentCount];
                span.setAttribute('contenteditable', 'false');

                let afterText = node.splitText(index - currentCount);
                afterText.textContent = afterText.textContent.substring(1);
                node.parentNode.insertBefore(span, afterText);
                found = true;
            } else {
                currentCount += node.length;
            }
        } else if (node.nodeType === 1) {
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }
}
// END NOT MY CODE

function setState(_state) {
    state = _state;
    document.body.setAttribute("state", state);
    elements.inputPanel.contentEditable = (state < 3).toString();
    if (state < 4) continueAfterInput = false;
    if (state < 5 && state > 2) highlightChar((Atomics.load(pointers, 0) || 1) - 1);
    else if (state == 5 && continueAfterInput) {
        const i = setInterval(() => {
            if (state == 5) highlightChar((Atomics.load(pointers, 0) || 1) - 1); 
            else clearInterval(i);
        }, 200);
    }
    else clearHighlights();
}

const decoder = new TextDecoder('ascii');
function pushOutput(v) {
    outputs.push(v);
    if (outputs.length > 10000) {
        outputs = outputs.slice(1)
    }
    elements.staticOutput.innerHTML = decoder.decode(new Uint8Array(outputs));
    if (continueAfterInput) executeAll();
}

function handleInput(e) {
    if (e.key === "Enter") {
        const inpField = elements.editableOutput;
        inpField.removeEventListener("keydown", handleInput);
        e.preventDefault();
        inpField.contentEditable = "false";

        let val = 0;
        if (inpField.textContent[0] != '\\') val = inpField.textContent.charCodeAt(0);
        else val = parseInt(inpField.textContent.slice(1)) || 0;
        Atomics.store(tape, Atomics.load(pointers, 1), val);

        inpField.textContent = "";
        pushOutput(val);
    }
}

function requestInput() {
    const inpField = elements.editableOutput;
    inpField.contentEditable = "true";
    inpField.focus();
    inpField.addEventListener("keydown", handleInput);
}

function executeAll() {
    if (state < 3) sendScript(elements.inputPanel.textContent);
    continueAfterInput = true;
    worker.postMessage({type: "run"});
}

function run() {
    Atomics.store(flag, 0, 0);
    executeAll();
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
    setState(3);
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

function setTapeVal(i, v) {
    worker.postMessage({type: "setTapeVal", data: {index: i, value: v}});
}

function tBtn0() {
    if (state > 2) stop();
    else init(tapeType, cellCount);
}

function tBtn1() {
    if (state > 3) pause();
    else run();
}

init(tapeType, cellCount);

// -- Unused --
// states = {
//     off: 0,  // BFI is unavailabe or turned off
//     empty: 1,  // BFI is blank and contains no data
//     full: 2,  // BFI has data in the tape and tape pointer but instruction pointer is set to 0
//     paused: 3,  // BFI is paused
//     waiting: 4,  // BFI is waiting for input for ',' command
//     running: 5,  // BFI is running
// };*/