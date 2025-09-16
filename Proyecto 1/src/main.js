const fs = require('fs');
const path = require('path');

const { lexer } = require('./lexer');
const { parsear_modelo } = require('./parser');
const { guardar_tokens_html, guardar_errores_html, guardar_resumen_html } = require('./reporters/html_report');
const { guardar_bracket_dot } = require('./reporters/graphviz'); // ← corregida la ruta

function asegurarDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function leerArchivo(ruta) {
  return fs.readFileSync(ruta, 'utf8');
}

function main() {
  //si no pasan path por CLI, usa samples/torneo1.txt
  const rutaEntrada = process.argv[2] || path.resolve(process.cwd(), 'samples', 'torneo1.txt');
  const input = leerArchivo(rutaEntrada);

  // 1)Lexer
  const lx = new lexer(input);
  const { tokens, errores: erroresLex } = lx.analizar();

  // 2)Parser -> modelo (stats, goleadores, partidos, info, errores semanticos)
  const modelo = parsear_modelo(tokens);

  // 3)unir errores (lexicos + semanticos)
  const errores = (modelo.errores_semanticos && modelo.errores_semanticos.length)
    ? erroresLex.concat(modelo.errores_semanticos)
    : erroresLex;

  // 4)out/
  const outDir = path.resolve(process.cwd(), 'out');
  asegurarDir(outDir);

  // 5)Reportes
  guardar_tokens_html(tokens, outDir);
  guardar_errores_html(errores, outDir);
  guardar_resumen_html(modelo, outDir);
  guardar_bracket_dot(modelo, outDir);


  console.log('Analisis completado');
  console.log('Archivo:', path.basename(rutaEntrada));
  console.log('Reportes en:', outDir);
}

if (require.main === module) main();
