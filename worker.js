onmessage = (event) => {
    const buffer = event.data;
    const view = new Uint8Array(buffer);
    Atomics.store(view, 0, 12);
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
