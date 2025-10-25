import IO from "../Utils/IO/IO.js";
import Scanner from "../Language/Scanner.js";
import Parser from "../Language/Parser.js";
import { errors } from "../Utils/Errors.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// raiz del proyecto = .../Traductor
const ROOT = path.resolve(__dirname, "../../");

const io = new IO();

const [input, error] = io.readFile(path.join(ROOT, "Input", "Input.txt"));
if (error) {
  console.error(`Error al leer el archivo: ${error.message}`);
  throw new Error(error);
}

console.log("=== Entrada ===");
const lines = input.split("\n");
const width = String(lines.length).length;
for (let i = 0; i < lines.length; i++) {
  const n = (i + 1).toString().padStart(width, " ");
  console.log(`\x1b[96m${n}\x1b[0m │ ${lines[i]}`);
}
console.log("===============");

const scanner = new Scanner(input);
const parser = new Parser(scanner);
parser.parse();

const py = parser.getPythonCode();
console.log("\n=== PYTHON TRADUCIDO ===");
console.log(py);

// guardar a /Output/output.py
const OUT_DIR = path.join(ROOT, "Output");
fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT_FILE = path.join(OUT_DIR, "output.py");
fs.writeFileSync(OUT_FILE, py ?? "", "utf-8");
console.log(`\n✅ Python guardado en: ${OUT_FILE}`);

console.log("\n\x1b[31mERRORS\x1b[0m");
console.table(errors);

//==========================================================
// reporte html simple
function html_base(titulo, tabla) {
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>${titulo}</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;padding:24px;background:#0f172a;color:#e2e8f0}
h1{margin:0 0 16px 0;font-size:20px}
table{border-collapse:collapse;width:100%;background:#111827}
th,td{border:1px solid #374151;padding:8px 10px;text-align:left;font-size:14px}
th{background:#1f2937}
tr:nth-child(even){background:#0b1220}
.bad{color:#fecaca}
.ok{color:#bbf7d0}
</style>
</head><body>
<h1>${titulo}</h1>
${tabla}
</body></html>`;
}

function tabla_errores(errs) {
  if (!errs || errs.length === 0) return "<p class='ok'>sin errores</p>";
  const rows = errs.map(e =>
    `<tr><td>${e.type}</td><td>${e.message}</td><td>${e.line}</td><td>${e.column}</td></tr>`
  ).join("");
  return `<table><thead><tr><th>tipo</th><th>mensaje</th><th>linea</th><th>columna</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function escanear_tokens(src) {
  const sc = new Scanner(src);
  const toks = [];
  let t = sc.next_token();
  while (t.type !== "EOF") { toks.push(t); t = sc.next_token(); }
  return toks;
}

function tabla_tokens(toks){
  const rows = toks.map(t =>
    `<tr><td>${t.type}</td><td>${String(t.lexeme).replaceAll("<","&lt;")}</td><td>${t.line}</td><td>${t.column}</td></tr>`
  ).join("");
  return `<table><thead><tr><th>tipo</th><th>lexema</th><th>linea</th><th>columna</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// generar archivos
const REPORTS_DIR = path.join(ROOT, "Reports");
fs.mkdirSync(REPORTS_DIR, { recursive: true });

const toks = escanear_tokens(input);
fs.writeFileSync(
  path.join(REPORTS_DIR, "tokens.html"),
  html_base("Reporte de tokens", tabla_tokens(toks)),
  "utf-8"
);
fs.writeFileSync(
  path.join(REPORTS_DIR, "errores.html"),
  html_base("Reporte de errores", tabla_errores(errors)),
  "utf-8"
);
console.log(`✅ Reportes en ${REPORTS_DIR}\\tokens.html y errores.html`);

io.close();
