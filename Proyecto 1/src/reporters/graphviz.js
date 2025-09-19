const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

function normalizaFase(f) {
  if (!f) return 'otros';
  const s = String(f).toLowerCase();
  if (s.includes('cuarto')) return 'cuartos';
  if (s.includes('semi')) return 'semifinal';
  if (s === 'final') return 'final';
  if (s.includes('final')) return 'semifinal';
  return s;
}

function faseOrden(f) {
  const f2 = normalizaFase(f);
  if (f2 === 'cuartos') return 1;
  if (f2 === 'semifinal') return 2;
  if (f2 === 'final') return 3;
  return 0;
}

function guardar_bracket_dot(modelo, destinoDir) {
  const partidos = Array.isArray(modelo.partidos) ? modelo.partidos.slice() : [];
  const grupos = {};
  for (let i = 0; i < partidos.length; i++) {
    const p = partidos[i];
    const f = normalizaFase(p.fase);
    if (!grupos[f]) grupos[f] = [];
    grupos[f].push(p);
  }
  const fases = Object.keys(grupos).sort((a, b) => faseOrden(a) - faseOrden(b));

  const L = [];
  L.push('digraph Bracket {');
  L.push('  rankdir=LR;');
  L.push('  splines=true;');
  L.push('  node [shape=box, style="rounded,filled", fillcolor="#f7f7f7"];');
  L.push('  edge [fontsize=10, color="#777"];');

  for (let i = 0; i < fases.length; i++) {
    const fase = fases[i];
    const arr = grupos[fase];
    L.push(`  subgraph cluster_${i} {`);
    L.push(`    label="${fase.toUpperCase()}"; labelloc="t"; fontsize=12; color="#ccc";`);
    for (let j = 0; j < arr.length; j++) {
      const p = arr[j];
      const e1 = String(p.e1 || '');
      const e2 = String(p.e2 || '');
      const res = String(p.resultado || '');
      const gid = `g_${i}_${j}`;
      L.push(`    "${e1}" [shape=box];`);
      L.push(`    "${e2}" [shape=box];`);
      L.push(`    "${gid}" [label="${res}", shape=oval, fillcolor="#eef"];`);
      L.push(`    "${e1}" -> "${gid}";`);
      L.push(`    "${e2}" -> "${gid}";`);
      if (p.ganador) L.push(`    "${gid}" -> "${p.ganador}" [color="#2a7"];`);
    }
    L.push('  }');
  }
  L.push('}');

  fs.writeFileSync(path.join(destinoDir, 'bracket.dot'), L.join('\n'));
}

// dot -Tpng out/bracket.dot -o out/bracket.png
function guardar_bracket_png(destinoDir, cb) {
  const dotPath = path.join(destinoDir, 'bracket.dot');
  const pngPath = path.join(destinoDir, 'bracket.png');
  execFile('dot', ['-Tpng', dotPath, '-o', pngPath], (err) => {
    if (cb) cb(err, pngPath);
  });
}

module.exports = { guardar_bracket_dot, guardar_bracket_png };
