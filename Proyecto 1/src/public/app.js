class token {
  constructor(tipo, lexema, linea, columna) {
    this.tipo = tipo;
    this.lexema = lexema;
    this.linea = linea;
    this.columna = columna;
  }
}
const tipos_token = Object.freeze({
  PALABRA_RESERVADA: 'PALABRA_RESERVADA',
  IDENTIFICADOR: 'IDENTIFICADOR',
  CADENA: 'CADENA',
  NUMERO: 'NUMERO',
  SIMBOLO: 'SIMBOLO'
});
class error_lexico {
  constructor(lexema, tipo, descripcion, linea, columna) {
    this.lexema = lexema;
    this.tipo = tipo;
    this.descripcion = descripcion;
    this.linea = linea;
    this.columna = columna;
  }
}
const reservadas = new Set([
  'TORNEO', 'EQUIPOS', 'ELIMINACION',
  'equipo', 'jugador', 'partido', 'goleador',
  'nombre', 'equipos', 'posicion', 'numero', 'edad',
  'resultado', 'goleadores', 'sede',
  'cuartos', 'semifinal', 'final', 'fase', 'minuto', 'vs'
]);


// LEXER (AFD)

class lexer {
  constructor(input) {
    this.input = input;
    this.i = 0;
    this.linea = 1;
    this.columna = 1;
    this.tokens = [];
    this.errores = [];
    this.pila = []; // balanceo {} []
  }

  analizar() {
    while (!this._eof()) {
      const ch = this._peek();

      if (this._isWhitespace(ch)) { this._consumeWhitespace(); continue; }
      if (this._isLetter(ch))     { this._scanIdent();        continue; }
      if (this._isDigit(ch))      { this._scanNumber();       continue; }
      if (ch === '"')             { this._scanString();       continue; }
      if (this._isSymbol(ch))     { this._emitSymbol(this._next()); continue; }

      const startCol = this.columna;
      const bad = this._next();
      this.errores.push(new error_lexico(bad, 'TOKEN_INVALIDO', 'Caracter no reconocido', this.linea, startCol));
    }

    // aperturas sin cierre
    while (this.pila.length > 0) {
      const top = this.pila.pop();
      this.errores.push(new error_lexico(top.simbolo, 'SIMBOLO_ESPERADO_FALTANTE', 'Simbolo de cierre faltante', top.linea, top.columna));
    }
    return { tokens: this.tokens, errores: this.errores };
  }

  _scanIdent() {
    const linea = this.linea; const col = this.columna;
    let lex = '';
    while (!this._eof() && (this._isLetter(this._peek()) || this._isDigit(this._peek()) || this._peek() === '_')) {
      lex += this._next();
    }
    const tipo = reservadas.has(lex) ? tipos_token.PALABRA_RESERVADA : tipos_token.IDENTIFICADOR;
    this.tokens.push(new token(tipo, lex, linea, col));
  }

  _scanNumber() {
    const linea = this.linea; const col = this.columna;
    let lex = '';
    while (!this._eof() && this._isDigit(this._peek())) lex += this._next();
    this.tokens.push(new token(tipos_token.NUMERO, lex, linea, col));
  }

  _scanString() {
    const linea = this.linea; const col = this.columna;
    let lex = '';
    this._next(); // consumir "
    let cerrado = false;
    while (!this._eof()) {
      const ch = this._next();
      if (ch === '"') { cerrado = true; break; }
      if (ch === '\\') {
        if (!this._eof()) { lex += ch + this._next(); continue; }
      }
      if (ch === '\n') { this.linea++; this.columna = 1; }
      else { lex += ch; }
    }
    if (!cerrado) {
      this.errores.push(new error_lexico('"' + lex, 'COMILLA_MAL_CERRADA', 'Cadena sin comilla de cierre', linea, col));
      return;
    }
    this.tokens.push(new token(tipos_token.CADENA, lex, linea, col));
  }

  _emitSymbol(sym) {
    const linea = this.linea; const col = this.columna - 1;
    if (sym === '{' || sym === '[') {
      this.pila.push({ simbolo: sym, linea, columna: col });
    } else if (sym === '}' || sym === ']') {
      const esperado = (sym === '}') ? '{' : '[';
      const top = this.pila.pop();
      if (!top || top.simbolo !== esperado) {
        this.errores.push(new error_lexico(sym, 'SIMBOLO_ESPERADO_FALTANTE', 'Se esperaba cierre para ' + esperado, linea, col));
      }
    }
    this.tokens.push(new token(tipos_token.SIMBOLO, sym, linea, col));
  }

  _isWhitespace(ch) { return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n'; }
  _isDigit(ch)      { return ch >= '0' && ch <= '9'; }
  _isSymbol(ch)     { return '{}[]:,-'.includes(ch); }
  _isLetter(ch) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90)  return true; // A-Z
    if (code >= 97 && code <= 122) return true; // a-z
    if (code === 209 || code === 241) return true; // Ñ ñ
    switch (code) { // vocales con acento no se usaran en las entradas
      case 193: case 201: case 205: case 211: case 218:
      case 225: case 233: case 237: case 243: case 250:
        return true;
    }
    return false;
  }

  _consumeWhitespace() {
    while (!this._eof() && this._isWhitespace(this._peek())) {
      const ch = this._next();
      if (ch === '\n') { this.linea++; this.columna = 1; }
    }
  }
  _peek() { return this.input[this.i]; }
  _next() { const ch = this.input[this.i++]; this.columna++; return ch; }
  _eof()  { return this.i >= this.input.length; }
}


// PARSER

function parsear_modelo(tokens) {
  const ctx = {
    tks: tokens, i: 0,
    modelo: {
      info: {},
      equiposStats: [],
      goleadores: [],
      partidos: [],
      errores_semanticos: []
    },
    equipos: {},         
    stats: {},          
    goleadoresMap: {}   
  };

  function at()  { return ctx.tks[ctx.i]; }
  function adv() { return ctx.tks[ctx.i++]; }
  function hasNext(){ return ctx.i < ctx.tks.length; }

  function isRes(w){ const t = at(); return t && t.tipo==='PALABRA_RESERVADA' && t.lexema===w; }
  function isSym(s){ const t = at(); return t && t.tipo==='SIMBOLO' && t.lexema===s; }
  function expectRes(w,desc){ const t=at(); if(!t||t.tipo!=='PALABRA_RESERVADA'||t.lexema!==w){ pushErr(t,'FORMATO_INCORRECTO','Se esperaba '+w+' en '+desc); return null;} return adv(); }
  function expectSym(s,desc){ const t=at(); if(!t||t.tipo!=='SIMBOLO'||t.lexema!==s){ pushErr(t,'SIMBOLO_ESPERADO_FALTANTE','Falta '+s+' en '+desc); return null;} return adv(); }
  function expectTipo(tp,desc){ const t=at(); if(!t||t.tipo!==tp){ pushErr(t,'FORMATO_INCORRECTO','Se esperaba '+tp+' en '+desc); return null;} return adv(); }

  function pushErr(t,tipo,descripcion){
    const linea=t?t.linea:0, columna=t?t.columna:0, lexema=t?t.lexema:'';
    ctx.modelo.errores_semanticos.push({lexema,tipo,descripcion,linea,columna});
  }

  function validarResultado(str){
    let dash=-1;
    for(let i=0;i<str.length;i++){ if(str[i]==='-'){ dash=i; break; } }
    if(dash<=0 || dash>=str.length-1) return null;
    let x=0,y=0;
    for(let i=0;i<dash;i++){ const c=str[i]; if(c<'0'||c>'9')return null; x = x*10 + (c.charCodeAt(0)-48); }
    for(let i=dash+1;i<str.length;i++){ const c=str[i]; if(c<'0'||c>'9')return null; y = y*10 + (c.charCodeAt(0)-48); }
    return {x,y};
  }

  function ensureEquipo(n){
    if(!ctx.stats[n]) ctx.stats[n]={equipo:n,pj:0,g:0,p:0,gf:0,gc:0,dg:0,fase:'-'};
  }

  function regPartido(fase,e1,e2,resStr){
    ensureEquipo(e1); ensureEquipo(e2);
    let ganador=null;
    const vr=validarResultado(resStr);
    if(!vr){
      const t = at() || {linea:0,columna:0,lexema:resStr};
      pushErr(t,'FORMATO_INCORRECTO','Resultado invalido "'+resStr+'" (esperado "X-Y")');
    }else{
      const {x,y}=vr;
      ctx.stats[e1].pj++; ctx.stats[e2].pj++;
      ctx.stats[e1].gf+=x; ctx.stats[e1].gc+=y; ctx.stats[e1].dg=ctx.stats[e1].gf-ctx.stats[e1].gc;
      ctx.stats[e2].gf+=y; ctx.stats[e2].gc+=x; ctx.stats[e2].dg=ctx.stats[e2].gf-ctx.stats[e2].gc;
      if(x>y){ ctx.stats[e1].g++; ctx.stats[e2].p++; ganador=e1; }
      else if(y>x){ ctx.stats[e2].g++; ctx.stats[e1].p++; ganador=e2; }
    }
    ctx.modelo.partidos.push({fase,e1,e2,resultado:resStr,ganador});
    ctx.stats[e1].fase=fase; ctx.stats[e2].fase=fase;
  }

  function regGol(jugador,equipo,minuto,tokRef){
    if(minuto<0 || (minuto|0)!==minuto){
      pushErr(tokRef,'FORMATO_INCORRECTO','Minuto invalido ('+minuto+') para goleador '+jugador);
      return;
    }
    const key = jugador+'|'+equipo;
    if(!ctx.goleadoresMap[key]) ctx.goleadoresMap[key] = { jugador, equipo, goles:0, minutos:[] };
    ctx.goleadoresMap[key].goles++;
    ctx.goleadoresMap[key].minutos.push(minuto+"'");
  }

  function inferEquipo(j,e1,e2){
    if(ctx.equipos[e1]) for(const it of ctx.equipos[e1].jugadores){ if(it.nombre===j) return e1; }
    if(ctx.equipos[e2]) for(const it of ctx.equipos[e2].jugadores){ if(it.nombre===j) return e2; }
    return e1;
  }

  // ---- TORNEO ----
  function parseTorneo(){
    if(!expectRes('TORNEO','seccion TORNEO')) return;
    expectSym('{','TORNEO');
    while(hasNext() && !isSym('}')){
      if(isRes('nombre')){ adv(); expectSym(':','nombre'); const cad=expectTipo('CADENA','nombre'); if(cad) ctx.modelo.info['Nombre del Torneo']=cad.lexema; }
      else if(isRes('equipos')){ adv(); expectSym(':','equipos'); const num=expectTipo('NUMERO','equipos'); if(num) ctx.modelo.info['Equipos Participantes']=parseInt(num.lexema,10); }
      else if(isRes('sede')){ adv(); expectSym(':','sede'); const cad=expectTipo('CADENA','sede'); if(cad) ctx.modelo.info['Sede']=cad.lexema; }
      else { pushErr(at(),'FORMATO_INCORRECTO','Atributo no reconocido en TORNEO'); adv(); }
      if(isSym(',')) adv();
    }
    expectSym('}','cierre TORNEO');
  }

  // ---- EQUIPOS ----
  function parseEquipos(){
    if(!expectRes('EQUIPOS','seccion EQUIPOS')) return;
    expectSym('{','EQUIPOS');
    while(hasNext() && !isSym('}')){
      if(isRes('equipo')){
        adv(); expectSym(':','equipo'); const nombre=expectTipo('CADENA','nombre equipo');
        const eqName = nombre? nombre.lexema : 'DESCONOCIDO';
        ensureEquipo(eqName);
        ctx.equipos[eqName] = ctx.equipos[eqName] || {jugadores:[]};

        expectSym('[','lista de jugadores');
        while(hasNext() && !isSym(']')){
          if(isRes('jugador')){
            adv(); expectSym(':','jugador'); const cadNom=expectTipo('CADENA','nombre jugador');
            const jugName = cadNom? cadNom.lexema : '???';
            expectSym('[','detalles jugador');
            let pos=null, numero=null, edad=null;
            while(hasNext() && !isSym(']')){
              if(isRes('posicion')){ adv(); expectSym(':','posicion'); const c=expectTipo('CADENA','posicion'); pos=c?c.lexema:null; }
              else if(isRes('numero')){ adv(); expectSym(':','numero'); const n=expectTipo('NUMERO','numero'); numero=n?parseInt(n.lexema,10):null; }
              else if(isRes('edad')){ adv(); expectSym(':','edad'); const n=expectTipo('NUMERO','edad'); edad=n?parseInt(n.lexema,10):null; }
              else { pushErr(at(),'FORMATO_INCORRECTO','Atributo no reconocido en jugador'); adv(); }
              if(isSym(',')) adv();
            }
            expectSym(']','cierre detalles jugador');
            ctx.equipos[eqName].jugadores.push({nombre:jugName,posicion:pos,numero,edad});
          } else { pushErr(at(),'FORMATO_INCORRECTO','Elemento no reconocido en la lista de jugadores'); adv(); }
          if(isSym(',')) adv();
        }
        expectSym(']','cierre lista jugadores');
      } else { pushErr(at(),'FORMATO_INCORRECTO','Elemento no reconocido en EQUIPOS'); adv(); }
      if(isSym(',')) adv();
    }
    expectSym('}','cierre EQUIPOS');
  }

  // ---- ELIMINACION ----
  function parseEliminacion(){
    if(!expectRes('ELIMINACION','seccion ELIMINACION')) return;
    expectSym('{','ELIMINACION');

    while(hasNext() && !isSym('}')){
      if(isRes('cuartos')||isRes('semifinal')||isRes('final')||isRes('fase')){
        const faseTok=adv(); const fase=faseTok.lexema;
        expectSym(':','fase');

        if(isSym('[')){
          adv();
          while(hasNext() && !isSym(']')){
            if(isRes('partido')){
              adv(); expectSym(':','partido');
              const eq1=expectTipo('CADENA','equipo 1'); const e1=eq1?eq1.lexema:'???';
              if(!isRes('vs')) pushErr(at(),'FORMATO_INCORRECTO','Falta palabra reservada vs'); else adv();
              const eq2=expectTipo('CADENA','equipo 2'); const e2=eq2?eq2.lexema:'???';

              expectSym('[','detalle partido');
              let resStr='-';
              while(hasNext() && !isSym(']')){
                if(isRes('resultado')){
                  adv(); expectSym(':','resultado');
                  const cad=expectTipo('CADENA','resultado "X-Y"');
                  resStr = cad? cad.lexema : '-';
                } else if(isRes('goleadores')){
                  adv(); expectSym(':','goleadores'); expectSym('[','lista goleadores');
                  while(hasNext() && !isSym(']')){
                    const jCad=expectTipo('CADENA','nombre goleador');
                    const jug=jCad? jCad.lexema : '???';
                    expectSym('[','detalle goleador');
                    if(!isRes('minuto')) pushErr(at(),'FORMATO_INCORRECTO','Se esperaba atributo minuto');
                    else{
                      adv(); expectSym(':','minuto');
                      const n=expectTipo('NUMERO','minuto');
                      const minuto = n? parseInt(n.lexema,10) : -1;
                      regGol(jug, inferEquipo(jug,e1,e2), minuto, n||at());
                    }
                    expectSym(']','cierre detalle goleador');
                    if(isSym(',')) adv();
                  }
                  expectSym(']','cierre lista goleadores');
                } else { pushErr(at(),'FORMATO_INCORRECTO','Atributo no reconocido en detalle de partido'); adv(); }
                if(isSym(',')) adv();
              }
              expectSym(']','cierre detalle partido');
              regPartido(fase,e1,e2,resStr);
              if(isSym(',')) adv();
            } else { pushErr(at(),'FORMATO_INCORRECTO','Elemento no reconocido en fase (se esperaba partido)'); adv(); if(isSym(',')) adv(); }
          }
          expectSym(']','cierre fase');
        } else { pushErr(at(),'FORMATO_INCORRECTO','Se esperaba "[" para fase'); }
      } else { pushErr(at(),'FORMATO_INCORRECTO','Elemento no reconocido en ELIMINACION'); adv(); }
    }
    expectSym('}','cierre ELIMINACION');
  }

  // entrada principal
  while(hasNext()){
    if(isRes('TORNEO')) parseTorneo();
    else if(isRes('EQUIPOS')) parseEquipos();
    else if(isRes('ELIMINACION')) parseEliminacion();
    else adv();
  }

  // consolidaciones
  ctx.modelo.equiposStats = Object.values(ctx.stats);
  ctx.modelo.goleadores   = Object.values(ctx.goleadoresMap);

  const totalPartidos = ctx.modelo.partidos.length;
  let totalGoles = 0;
  for(const g of ctx.modelo.goleadores) totalGoles += g.goles;
  ctx.modelo.info['Total de Partidos Programados'] = totalPartidos;
  ctx.modelo.info['Partidos Completados'] = totalPartidos;
  ctx.modelo.info['Total de Goles'] = totalGoles;
  ctx.modelo.info['Promedio de Goles por Partido'] = totalPartidos>0 ? (totalGoles/totalPartidos).toFixed(2) : '0.00';
  if(ctx.modelo.partidos.length) ctx.modelo.info['Fase Actual'] = ctx.modelo.partidos[ctx.modelo.partidos.length-1].fase;

  return ctx.modelo;
}


// Reportes (HTML y DOT)

function _table(headers, rows){
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const th = headers.map(h=>`<th>${esc(h)}</th>`).join('');
  const tr = rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('\n');
  return `<table border="1" cellspacing="0" cellpadding="6">
  <thead><tr>${th}</tr></thead>
  <tbody>
${tr}
  </tbody>
</table>`;
}

function tokensHTML(tokens){
  const rows = tokens.map((t,i)=>[i+1, JSON.stringify(t.lexema), t.tipo, t.linea, t.columna]);
  return `<!doctype html><meta charset="utf-8"><title>Tokens</title>
  <h1>Tokens Extraidos</h1>
  ${_table(['No', 'Lexema', 'Tipo', 'Linea', 'Columna'], rows)}`;
}

function erroresHTML(errores){
  const rows = errores.map((e,i)=>[i+1, JSON.stringify(e.lexema), e.tipo, e.descripcion, e.linea, e.columna]);
  return `<!doctype html><meta charset="utf-8"><title>Errores</title>
  <h1>Errores</h1>
  ${_table(['No','Lexema','Tipo de Error','Descripcion','Linea','Columna'], rows)}`;
}

function resumenHTML(modelo){
  const info = modelo.info||{};
  const equiposStats = modelo.equiposStats||[];
  const goleadores = (modelo.goleadores||[]).slice().sort((a,b)=> b.goles - a.goles || a.jugador.localeCompare(b.jugador));
  const partidos = modelo.partidos||[];
  const errs = modelo.errores_semanticos||[];

  const infoRows = Object.entries(info);
  const infoHtml = _table(['Estadistica','Valor'], infoRows);

  // Tabla de posiciones orden: Pts desc, DG desc, GF desc, nombre asc
  const eqRowsRaw = equiposStats.map(e=>({
    equipo:e.equipo, pj:e.pj, g:e.g, p:e.p, gf:e.gf, gc:e.gc, dg:e.dg, fase:e.fase, pts:e.g*3
  }));
  eqRowsRaw.sort((a,b)=> (b.pts-a.pts) || (b.dg-a.dg) || (b.gf-a.gf) || a.equipo.localeCompare(b.equipo));
  const posRows = eqRowsRaw.map((e,i)=>[i+1, e.equipo, e.pj, e.g, e.p, e.gf, e.gc, e.dg, e.pts, e.fase]);
  const posHtml = _table(['Pos','Equipo','PJ','G','P','GF','GC','DG','Pts','Fase'], posRows);

  const golRows = goleadores.map((g,i)=>[i+1, g.jugador, g.equipo, g.goles, (g.minutos||[]).join(', ')]);
  const golHtml = _table(['Pos','Jugador','Equipo','Goles','Minutos'], golRows);

  const parRows = partidos.map(p=>[p.fase, `${p.e1} vs ${p.e2}`, p.resultado, p.ganador||'-']);
  const parHtml = _table(['Fase','Partido','Resultado','Ganador'], parRows);

  const errsRows = errs.map((e,i)=>[i+1,e.lexema,e.tipo,e.descripcion,e.linea,e.columna]);
  const errsHtml = errsRows.length ? `<h2>Errores de Formato y Consistencia</h2>${_table(['No','Lexema','Tipo','Descripcion','Linea','Columna'], errsRows)}` : '';

  const bracketSection = `
    <h2>Bracket de Eliminacion</h2>
    <p class="muted">Descarga bracket.dot y genera bracket.png con Graphviz:
      dot -Tpng bracket.dot -o bracket.png</p>
  `;

  return `<!doctype html><meta charset="utf-8"><title>Resumen</title>
  <h1>Resumen del Torneo</h1>
  <h2>Informacion General</h2>${infoHtml}
  <h2>Tabla de Posiciones</h2>${posHtml}
  <h2>Goleadores</h2>${golHtml}
  <h2>Partidos</h2>${parHtml}
  ${bracketSection}
  ${errsHtml}`;
}

function bracketDOT(modelo){
  const partidos = Array.isArray(modelo.partidos)? modelo.partidos.slice() : [];
  const normalizaFase = (f)=>{
    if(!f) return 'otros';
    const s=String(f).toLowerCase();
    if(s.includes('cuarto')) return 'cuartos';
    if(s.includes('semi'))   return 'semifinal';
    if(s==='final')          return 'final';
    if(s.includes('final'))  return 'semifinal';
    return s;
    };
  const faseOrden = (f)=>{
    const m = normalizaFase(f);
    if(m==='cuartos') return 1;
    if(m==='semifinal') return 2;
    if(m==='final') return 3;
    return 0;
  };
  const grupos = {};
  for(const p of partidos){
    const f = normalizaFase(p.fase);
    if(!grupos[f]) grupos[f]=[];
    grupos[f].push(p);
  }
  const fases = Object.keys(grupos).sort((a,b)=> faseOrden(a)-faseOrden(b));

  const L=[];
  L.push('digraph Bracket {');
  L.push('  rankdir=LR;');
  L.push('  splines=true;');
  L.push('  node [shape=box, style="rounded,filled", fillcolor="#f7f7f7"];');
  L.push('  edge [fontsize=10, color="#777"];');

  fases.forEach((fase, i)=>{
    const arr = grupos[fase];
    L.push(`  subgraph cluster_${i} {`);
    L.push(`    label="${fase.toUpperCase()}"; labelloc="t"; fontsize=12; color="#ccc";`);
    arr.forEach((p,j)=>{
      const e1=String(p.e1||''), e2=String(p.e2||''), res=String(p.resultado||''), gid=`g_${i}_${j}`;
      L.push(`    "${e1}" [shape=box];`);
      L.push(`    "${e2}" [shape=box];`);
      L.push(`    "${gid}" [label="${res}", shape=oval, fillcolor="#eef"];`);
      L.push(`    "${e1}" -> "${gid}";`);
      L.push(`    "${e2}" -> "${gid}";`);
      if(p.ganador) L.push(`    "${gid}" -> "${p.ganador}" [color="#2a7"];`);
    });
    L.push('  }');
  });
  L.push('}');
  return L.join('\n');
}


// UI / Integracion
// ========================
const $ = sel => document.querySelector(sel);
const fileInput = $('#fileInput');
const analyzeBtn = $('#analyzeBtn');
const statusEl = $('#status');

const dlTokens = $('#dlTokens');
const dlErrores = $('#dlErrores');
const dlResumen = $('#dlResumen');
const dlDot = $('#dlDot');

const pvTokens = $('#pvTokens');
const pvErrores = $('#pvErrores');
const pvResumen = $('#pvResumen');
const pvDot = $('#pvDot');

let lastURLs = [];
function setDownloadLink(aEl, filename, text){
  const blob = new Blob([text], {type: 'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  lastURLs.push(url);
  aEl.href = url;
  aEl.download = filename;
  aEl.classList.remove('hidden');
}
function setDownloadRaw(aEl, filename, text){
  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  lastURLs.push(url);
  aEl.href = url;
  aEl.download = filename;
  aEl.classList.remove('hidden');
}
function loadIframe(iframe, htmlText){
  const blob = new Blob([htmlText], {type:'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  lastURLs.push(url);
  iframe.src = url;
}

analyzeBtn.addEventListener('click', async ()=>{
  try{
    lastURLs.forEach(u=>URL.revokeObjectURL(u));
    lastURLs = [];
    [dlTokens, dlErrores, dlResumen, dlDot].forEach(a=>a.classList.add('hidden'));

    statusEl.textContent = 'Procesando...';
    const file = fileInput.files && fileInput.files[0];
    if(!file){ statusEl.textContent = 'Selecciona un archivo .txt'; return; }

    const text = await file.text();

    // LEXER
    const lx = new lexer(text);
    const { tokens, errores: erroresLex } = lx.analizar();

    // PARSER
    const modelo = parsear_modelo(tokens);

    // Unir errores
    const errores = (modelo.errores_semanticos && modelo.errores_semanticos.length)
      ? erroresLex.concat(modelo.errores_semanticos)
      : erroresLex;

    // Reportes
    const htmlTokens  = tokensHTML(tokens);
    const htmlErrores = erroresHTML(errores);
    const htmlResumen = resumenHTML(modelo);
    const dot         = bracketDOT(modelo);

    // Descargas
    setDownloadLink(dlTokens, 'tokens.html', htmlTokens);
    setDownloadLink(dlErrores, 'errores.html', htmlErrores);
    setDownloadLink(dlResumen, 'resumen.html', htmlResumen);
    setDownloadRaw (dlDot,     'bracket.dot', dot);

    // Vistas
    loadIframe(pvTokens,  htmlTokens);
    loadIframe(pvErrores, htmlErrores);
    loadIframe(pvResumen, htmlResumen);
    pvDot.textContent = dot;

    statusEl.textContent = 'Listo';
  }catch(err){
    console.error(err);
    statusEl.textContent = 'Error procesando el archivo';
  }
});
