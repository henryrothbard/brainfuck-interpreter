class BrainfuckInterpreter {
    constructor(script = "", max_cells = 30000) {
        this.script = script;
        this.array = [];
        this.max_cells = max_cells;  // if set to zero there is no limit
        this.instructionPointer = 0;
        this.dataPointer = 0;
    }
    
    // removes unnecesary zeros
    popAllZeros() {
        for (let i = this.array.length - 1; i > this.dataPointer; i--) {
            if (this.array[i] === 0) this.array.pop();
            else break;
        }
    }

    // right left increment decrement output input loopStart loopEnd
}