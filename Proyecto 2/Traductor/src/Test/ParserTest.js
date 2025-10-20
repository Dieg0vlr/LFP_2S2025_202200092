import IO from "../Utils/IO/IO.js";
import Scanner from "../Language/Scanner.js";
import Parser from "../Language/Parser.js";
import { errors } from "../Utils/Errors.js";

const io = new IO();

const [input, error] = io.readFile('./Input/Input.txt');

if (error) {
    console.error(`Error al leer el archivo: ${error.message}`);
    throw new Error(error);
}

console.log("=== Entrada ===");
const lines = input.split("\n");
const width = String(lines.length).length;

for (let i = 0; i < lines.length; i++) {
    const lineNumber = (i + 1).toString().padStart(width, ' ');
    console.log(`\x1b[96m${lineNumber}\x1b[0m │ ${lines[i]}`);
}
console.log("===============");

const scanner = new Scanner(input);
const parser = new Parser(scanner);

parser.parse();

console.log("\n\x1b[31mERRORS\x1b[0m");
console.table(errors)

io.close();