import readline from "readline";

export function createLogger(totalLines: number) {
    for (let i = 0; i < totalLines; i++) console.log("");

    return (line: number, text: string) => {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, line);
        readline.clearLine(process.stdout, 0);
        process.stdout.write(text);

        // revenir en bas
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, totalLines - line);
    };
}