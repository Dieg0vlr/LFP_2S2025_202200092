const fs = require('fs');
const path = require('path');

const { lexer } = require('./lexer');
const { guardar_tokens_html, guardar_errores_html, guardar_resumen_html } = require('./reporters/html_report');
const { guardar_bracket_dot } = require('/reporters/graphviz');

function asegurarDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true}); 
}

function leerArchivo(ruta) {
    return fs.readFileSync(ruta, 'utf8');
}

function main() {
    // si no se pasa path por CLI, usar samples/torneo1.txt
    const rutaEntrada = process.argv[2] || path.resolve(process.cwd(), 'samples', 'torneo1.txt');
    const input = leerArchivo(rutaEntrada);

    //Ejecutar lexer
    const lx = new lexer(input);
    const { tokens, errores } = lx.analizar();

    // out/
    const outDir = path.resolve(process.cwd(), 'out');
    asegurarDir(outDir);

    //reportes de tokens y errores
    guardar_tokens_html(tokens, outDir);
    guardar_errores_html(errores, outDir);

    //modelo minimo para resumen y bracket
    const modelo = {
        info: { 'Archivo Analizado': path.basename(rutaEntrada)},
        equiposStats: [],
        goleadores: [],
        partidos: [],
        errores_semanticos: []  
    };

    guardar_resumen_html(modelo, outDir);
    guardar_bracket_dot(modelo, outDir);

    HTMLFormControlsCollection.log(' Analisis Completado');
    console.log('Revisa la carpeta:', outDir);
}

if (require.main === module) main();