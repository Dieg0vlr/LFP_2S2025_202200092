function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function _table(headers, rows){
  const th = headers.map(h=>`<th>${_esc(h)}</th>`).join('');
  const tr = rows.map(r=>`<tr>${r.map(c=>`<td>${_esc(c)}</td>`).join('')}</tr>`).join('\n');
  return `<table border="1" cellspacing="0" cellpadding="6">
<thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

export function tokens_html(tokens){
  const rows = tokens.map((t,i)=>[i+1, JSON.stringify(t.lexema), t.tipo, t.linea, t.columna]);
  return `<!doctype html><meta charset="utf-8"><title>Tokens</title>
<h1>Tokens Extraidos</h1>${_table(['No','Lexema','Tipo','Linea','Columna'], rows)}`;
}

export function errores_html(errores){
  const rows = errores.map((e,i)=>[i+1, JSON.stringify(e.lexema), e.tipo, e.descripcion, e.linea, e.columna]);
  return `<!doctype html><meta charset="utf-8"><title>Errores Lexicos</title>
<h1>Errores Lexicos</h1>${_table(['No','Lexema','Tipo de Error','Descripcion','Linea','Columna'], rows)}`;
}

export function resumen_html(modelo){
  const info = modelo.info||{};
  const equiposStats = modelo.equiposStats||[];
  const goleadores = (modelo.goleadores||[]).slice().sort((a,b)=>b.goles-a.goles||a.jugador.localeCompare(b.jugador));
  const partidos = modelo.partidos||[];
  const erroresS = modelo.errores_semanticos||[];

  const infoRows = Object.entries(info).map(([k,v])=>[k,v]);
  const infoHtml = _table(['Estadistica','Valor'], infoRows);

  const pos = equiposStats.map((e,i)=>[i+1,e.equipo,e.pj,e.g,e.p,e.gf,e.gc,e.dg,(e.g*3),e.fase]);
  const posHtml = _table(['Pos','Equipo','PJ','G','P','GF','GC','DG','Pts','Fase'], pos);

  const golRows = goleadores.map((g,i)=>[i+1,g.jugador,g.equipo,g.goles,(g.minutos||[]).join(', ')]);
  const golHtml = _table(['Pos','Jugador','Equipo','Goles','Minutos'], golRows);

  const parRows = partidos.map(p=>[p.fase, `${p.e1} vs ${p.e2}`, p.resultado, p.ganador||'-']);
  const parHtml = _table(['Fase','Partido','Resultado','Ganador'], parRows);

  let errsHtml = '';
  if (erroresS.length){
    const er = erroresS.map((e,i)=>[i+1,e.lexema,e.tipo,e.descripcion,e.linea,e.columna]);
    errsHtml = `<h2>Errores de Formato y Consistencia</h2>${_table(['No','Lexema','Tipo','Descripcion','Linea','Columna'], er)}`;
  }

  return `<!doctype html><meta charset="utf-8"><title>Resumen</title>
<h1>Resumen del Torneo</h1>
<h2>Informacion General</h2>${infoHtml}
<h2>Tabla de Posiciones</h2>${posHtml}
<h2>Goleadores</h2>${golHtml}
<h2>Partidos</h2>${parHtml}${errsHtml}`;
}

export function bracket_dot(modelo){
  const partidos = Array.isArray(modelo.partidos)?modelo.partidos.slice():[];
  const norm = f => {
    if(!f) return 'otros';
    const s=String(f).toLowerCase();
    if (s.includes('cuarto')) return 'cuartos';
    if (s.includes('semi')) return 'semifinal';
    if (s.includes('final')) return s==='final'?'final':'semifinal';
    return s;
  };
  const ord = f => ({cuartos:1, semifinal:2, final:3}[norm(f)]||0);
  const grupos = {};
  partidos.forEach(p => (grupos[norm(p.fase)] ??= []).push(p));
  const fases = Object.keys(grupos).sort((a,b)=>ord(a)-ord(b));

  const L=[];
  L.push('digraph Bracket {');
  L.push('  rankdir=LR;');
  L.push('  splines=true;');
  L.push('  node [shape=box, style="rounded,filled", fillcolor="#f7f7f7"];');
  L.push('  edge [fontsize=10, color="#777"];');
  fases.forEach((fase,i)=>{
    L.push(`  subgraph cluster_${i} {`);
    L.push(`    label="${fase.toUpperCase()}"; labelloc="t"; fontsize=12; color="#ccc";`);
    grupos[fase].forEach((p,j)=>{
      const e1=String(p.e1||''), e2=String(p.e2||''), res=String(p.resultado||'');
      const gid=`g_${i}_${j}`;
      L.push(`    "${e1}" [shape=box];`);
      L.push(`    "${e2}" [shape=box];`);
      L.push(`    "${gid}" [label="${res}", shape=oval, fillcolor="#eef"];`);
      L.push(`    "${e1}" -> "${gid}";`);
      L.push(`    "${e2}" -> "${gid}";`);
      if (p.ganador) L.push(`    "${gid}" -> "${p.ganador}" [color="#2a7"];`);
    });
    L.push('  }');
  });
  L.push('}');
  return L.join('\n');
}
