const fs = require('fs');
const path = require('path');

// normaliza y ordena fases
function norm(f) {
  if (!f) return 'otros';
  const s = String(f).toLowerCase();
  if (s.includes('cuarto')) return 'cuartos';
  if (s.includes('semi'))   return 'semifinal';
  if (s.trim() === 'final') return 'final';
  return s;
}
const ORDER = ['cuartos','semifinal','final'];
const phaseRank = f => ORDER.indexOf(norm(f)) === -1 ? 99 : ORDER.indexOf(norm(f));


function guardar_bracket_dot(modelo, destinoDir) {
  const partidosAll = Array.isArray(modelo.partidos) ? modelo.partidos.slice() : [];
  if (!partidosAll.length) {
    fs.writeFileSync(path.join(destinoDir, 'bracket.dot'), 'digraph G{}');
    return;
  }

  // Agrupar por fase normalizada y ordenar
  const grupos = {};
  for (const p of partidosAll) {
    const f = norm(p.fase);
    (grupos[f] ||= []).push(p);
  }
  const fases = Object.keys(grupos).sort((a,b)=> phaseRank(a)-phaseRank(b));

  // ID helpers 
  const safe = s => String(s || '').replace(/[^A-Za-z0-9_]/g, '_');
  const teamId = (phase, name) => `t_${safe(phase)}_${safe(name)}`;
  const resId  = (phase, idx)  => `r_${safe(phase)}_${idx}`;

  // Promueve a los ganadores usando un indice por fase → array de ganadores
  const winnersByPhase = {};
  for (const f of fases) winnersByPhase[f] = grupos[f].map(p => p.ganador).filter(Boolean);

  // Mapa de “nodos de equipo ya creados por fase” para evitar duplicados
  const createdTeamNode = {}; 

  const L = [];
  L.push('digraph Bracket {');
  L.push('  rankdir=LR;');
  L.push('  splines=true;');
  L.push('  nodesep=0.4; ranksep=1.0;');
  L.push('  edge [color="#777"];');
  L.push('  node [fontname="Arial"];');


  const teamStyle   = 'shape=box, style="rounded,filled", fillcolor="#ffffff", color="#333"';
  const winnerStyle = 'shape=box, style="rounded,filled", fillcolor="#ffffff", color="#2aa773", penwidth=2';
  const scoreStyle  = 'shape=oval, style=filled, fillcolor="#eef1ff", color="#333"';

  // Para saber la fase siguiente de cada fase
  const nextOf = {};
  for (let i=0;i<fases.length;i++){
    nextOf[fases[i]] = fases[i+1] || null;
  }

  // cada nodo de un equipo ganador se pinta de verde
  function ensureTeamNode(phase, name, isWinner=false) {
    const key = `${phase}||${name}`;
    if (createdTeamNode[key]) return;
    createdTeamNode[key] = true;

    const id = teamId(phase, name);
    const st = isWinner ? winnerStyle : teamStyle;
    L.push(`  "${id}" [${st}, label="${name}"];`);
  }


  fases.forEach((fase, phaseIndex) => {
    const partidos = grupos[fase];
    const faseLabel = fase.toUpperCase();

   
    L.push(`  subgraph cluster_${phaseIndex} {`);
    L.push(`    label="${faseLabel}"; labelloc="t"; fontsize=14; color="#dddddd";`);
    L.push('    style="rounded";');

  
    const phaseTeams = new Set();
    partidos.forEach(p => {
      if (p.e1) phaseTeams.add(p.e1);
      if (p.e2) phaseTeams.add(p.e2);
    });

    // Determinar ganadores de ESTA fase para resaltar en verde
    const winnersSet = new Set(partidos.map(p => p.ganador).filter(Boolean));

    phaseTeams.forEach(name => {
      const isWinnerHere = winnersSet.has(name);
      ensureTeamNode(fase, name, isWinnerHere);
    });

    // Por partido: resultado + aristas de equipos → resultado
    partidos.forEach((p, idx) => {
      const idScore = resId(fase, idx);
      const labelScore = String(p.resultado || '');
      L.push(`    "${idScore}" [${scoreStyle}, label="${labelScore}"];`);

      // conectar equipos de la fase → resultado
      if (p.e1) L.push(`    "${teamId(fase, p.e1)}" -> "${idScore}";`);
      if (p.e2) L.push(`    "${teamId(fase, p.e2)}" -> "${idScore}";`);
    });

    L.push('  }'); 

    // Promocionar ganadores a la fase siguiente y crea nodo del ganador en la fase siguiente y flecha resultado → ganadorSig
    const nextPhase = nextOf[fase];
    if (nextPhase) {
      const partidos = grupos[fase];
      partidos.forEach((p, idx) => {
        if (!p.ganador) return;
        // Crear nodo de equipo ganador en la fase siguiente (estilo ganador)
        ensureTeamNode(nextPhase, p.ganador, /*isWinner*/ true);

        // conectar resultado actual → nodo ganador en siguiente fase
        L.push(`  "${resId(fase, idx)}" -> "${teamId(nextPhase, p.ganador)}" [color="#2aa773"];`);
      });
    }
  });

  L.push('}');

  fs.writeFileSync(path.join(destinoDir, 'bracket.dot'), L.join('\n'));
}

module.exports = { guardar_bracket_dot };
