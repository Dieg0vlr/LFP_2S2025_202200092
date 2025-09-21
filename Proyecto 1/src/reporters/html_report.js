const fs = require('fs');
const path = require('path');

// Construye una <table> con headers y rows
function _table(headers, rows) {
  // thead
  let th = "";
  for (let i = 0; i < headers.length; i++) {
    th += "<th>" + headers[i] + "</th>";
  }

  // tbody
  let tr = "";
  for (let i = 0; i < rows.length; i++) {
    let fila = "<tr>";
    for (let j = 0; j < rows[i].length; j++) {
      // limpiar &, < para no romper el HTML
      const val = String(rows[i][j]);
      let safe = "";
      for (let k = 0; k < val.length; k++) {
        const c = val[k];
        if (c === "&") safe += "&amp;";
        else if (c === "<") safe += "&lt;";
        else safe += c;
      }
      fila += "<td>" + safe + "</td>";
    }
    fila += "</tr>\n";
    tr += fila;
  }

  return "<table border=\"1\" cellspacing=\"0\" cellpadding=\"6\">" +
         "<thead><tr>" + th + "</tr></thead>" +
         "<tbody>" + tr + "</tbody>" +
         "</table>";
}

// ----------------------- TOKENS --------------------
function guardar_tokens_html(tokens, destinoDir) {
  const rows = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const lexema = '"' + t.lexema + '"';
    rows.push([i + 1, lexema, t.tipo, t.linea, t.columna]);
  }

  const html =
    "<!doctype html><meta charset=\"utf-8\"><title>Tokens</title>" +
    "<h1>Tokens Extraidos</h1>" +
    _table(['No', 'Lexema', 'Tipo', 'Linea', 'Columna'], rows);

  fs.writeFileSync(path.join(destinoDir, 'tokens.html'), html);
}

// ----------------- ERRORES --------------------
function guardar_errores_html(errores, destinoDir) {
  const rows = [];
  for (let i = 0; i < errores.length; i++) {
    const e = errores[i];
    const lexema = '"' + e.lexema + '"';
    rows.push([i + 1, lexema, e.tipo, e.descripcion, e.linea, e.columna]);
  }

  const html =
    "<!doctype html><meta charset=\"utf-8\"><title>Errores Lexicos</title>" +
    "<h1>Errores Lexicos</h1>" +
    _table(['No', 'Lexema', 'Tipo de Error', 'Descripcion', 'Linea', 'Columna'], rows);

  fs.writeFileSync(path.join(destinoDir, 'errores.html'), html);
}

// --------------- RESUMEN (info + posiciones + goleadores + partidos) --------------
function guardar_resumen_html(modelo, destinoDir) {
  const info = modelo.info || {};
  const equiposStats = modelo.equiposStats || [];
  const goleadores = modelo.goleadores || [];
  const partidos = modelo.partidos || [];
  const errores_semanticos = modelo.errores_semanticos || [];

  // Info general
  const infoRows = [];
  const keys = Object.keys(info);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    infoRows.push([k, info[k]]);
  }
  const infoHtml = _table(['Estadistica', 'Valor'], infoRows);

  // Tabla de posiciones con puntos = 3 por victoria
  const eqRowsRaw = [];
  for (let i = 0; i < equiposStats.length; i++) {
    const e = equiposStats[i];
    const pts = (e.g * 3) + 0;
    eqRowsRaw.push({
      equipo: e.equipo, pj: e.pj, g: e.g, p: e.p, gf: e.gf, gc: e.gc, dg: e.dg, fase: e.fase, pts
    });
  }

  // Orden: Pts desc, DG desc, GF desc, nombre asc
  for (let i = 0; i < eqRowsRaw.length; i++) {
    for (let j = 0; j < eqRowsRaw.length - 1; j++) {
      const a = eqRowsRaw[j], b = eqRowsRaw[j + 1];
      const swap =
        (a.pts < b.pts) ||
        (a.pts === b.pts && a.dg < b.dg) ||
        (a.pts === b.pts && a.dg === b.dg && a.gf < b.gf) ||
        (a.pts === b.pts && a.dg === b.dg && a.gf === b.gf && a.equipo > b.equipo);
      if (swap) {
        const tmp = eqRowsRaw[j];
        eqRowsRaw[j] = eqRowsRaw[j + 1];
        eqRowsRaw[j + 1] = tmp;
      }
    }
  }

  const posRows = [];
  for (let i = 0; i < eqRowsRaw.length; i++) {
    const e = eqRowsRaw[i];
    posRows.push([i + 1, e.equipo, e.pj, e.g, e.p, e.gf, e.gc, e.dg, e.pts, e.fase]);
  }
  const posHtml = _table(['Pos','Equipo','PJ','G','P','GF','GC','DG','Pts','Fase'], posRows);

  // Goleadores: goles desc, nombre asc
  const ordenados = goleadores.slice();
  for (let i = 0; i < ordenados.length; i++) {
    for (let j = 0; j < ordenados.length - 1; j++) {
      const a = ordenados[j], b = ordenados[j + 1];
      const swap = (a.goles < b.goles) || (a.goles === b.goles && a.jugador > b.jugador);
      if (swap) {
        const tmp = ordenados[j];
        ordenados[j] = ordenados[j + 1];
        ordenados[j + 1] = tmp;
      }
    }
  }
  const golRows = [];
  for (let i = 0; i < ordenados.length; i++) {
    const g = ordenados[i];
    let minutosTxt = "";
    if (g.minutos && g.minutos.length) {
      for (let m = 0; m < g.minutos.length; m++) {
        minutosTxt += g.minutos[m];
        if (m < g.minutos.length - 1) minutosTxt += ", ";
      }
    }
    golRows.push([i + 1, g.jugador, g.equipo, g.goles, minutosTxt]);
  }
  const golHtml = _table(['Pos','Jugador','Equipo','Goles','Minutos'], golRows);

  // Partidos
  const parRows = [];
  for (let i = 0; i < partidos.length; i++) {
    const p = partidos[i];
    parRows.push([p.fase, p.e1 + " vs " + p.e2, p.resultado, p.ganador || "-"]);
  }
  const parHtml = _table(['Fase','Partido','Resultado','Ganador'], parRows);

  // Seccion de bracket (.dot) 
  const dotPath = path.join(destinoDir, 'bracket.dot');
  const bracketSection = fs.existsSync(dotPath)
    ? `<h2>Bracket (.dot)</h2><p>Archivo generado: <code>out/bracket.dot</code></p>`
    : "";

  // Errores de formato/consistencia
  let errsHtml = "";
  if (errores_semanticos.length) {
    const errsRows = [];
    for (let i = 0; i < errores_semanticos.length; i++) {
      const e = errores_semanticos[i];
      errsRows.push([i + 1, e.lexema, e.tipo, e.descripcion, e.linea, e.columna]);
    }
    errsHtml = "<h2>Errores de Formato y Consistencia</h2>" +
               _table(['No','Lexema','Tipo','Descripcion','Linea','Columna'], errsRows);
  }

  // HTML final
  const html =
    "<!doctype html><meta charset=\"utf-8\"><title>Resumen</title>" +
    "<h1>Resumen del Torneo</h1>" +
    "<h2>Informacion General</h2>" + infoHtml +
    "<h2>Tabla de Posiciones</h2>" + posHtml +
    "<h2>Goleadores</h2>" + golHtml +
    "<h2>Partidos</h2>" + parHtml +
    bracketSection +
    errsHtml;

  fs.writeFileSync(path.join(destinoDir, 'resumen.html'), html);
}

module.exports = { guardar_tokens_html, guardar_errores_html, guardar_resumen_html };
