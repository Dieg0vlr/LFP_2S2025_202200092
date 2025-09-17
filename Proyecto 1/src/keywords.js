// set de reservadas exactas y es case sensitive
const reservadas = new Set([
  'TORNEO','EQUIPOS','ELIMINACION',
  'nombre','equipos','sede',
  'equipo','jugador','posicion','numero','edad',
  'cuartos','semifinal','final','fase',
  'partido','vs','resultado','goleadores','minuto'
]);

module.exports = { reservadas };
