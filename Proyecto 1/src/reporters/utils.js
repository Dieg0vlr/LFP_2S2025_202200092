const fs = require('fs');
const path = require('path');

function leer_archivo(ruta) {
    return fs.readFileSync(ruta, 'utf8');
}

function asegurar_dir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function ruta_out() {
    return path.resolve(process.cwd(), 'out');
}

module.exports = { leer_archivo, asegurar_dir, ruta_out };