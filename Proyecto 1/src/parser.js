function parsear_modelo(tokens) {
    const ctx = {
        tks : tokens, i: 0,
        modelo: {
            info: {},
            equiposStats:[],
            goleadores: [],
            partidos: [],
            errores_semanticos: []
        },
        // mapas de trabajo
        equipos: {},    //nombreEquipo -> {jugadores: [......]}
        stats: {},     // nombreEquipo -> { pj, g, p, gf, gc, dg, fase }
        goleadoresMap: {}   //"Jugador1Equipo" -> { jugador, equipo, goles, minutos[] }
    };

    // helpers
    function at() {
        return ctx.tks[ctx.i]; 
    }

    function adv() {
        return ctx.tks[ctx.i++];
    }

    function hasNext() { 
        return ctx.i < ctx.tks.length; 
    }

    function isRes(word) {
        const t = at(); return t && t.tipo === 'PALABRA_RESERVADA' && t.lexema === word;
    }

    function isSym(sym) {
        const t = at(); return t && t.tipo === 'SIMBOLO' && t.lexema === sym; 
    }

    function isTipo(tipo) {
        const t = at(); return t && t.tipo === tipo;
    }

    function expectRes(word, desc) {
        const t = at();
        if (!t || t.tipo !== 'PALABRA_RESERVADA' || t.lexema !== word) {
            pushErr(t, 'FORMATO_INCORRECTO', `Se esperaba palabra reservada ${word} para ${desc}`);
            return null;
        }
        return adv();
    }

    function expectSym(sym, desc) {
        const t = at();
        if (!t || t.tipo !== 'SIMBOLO' || t.lexema !== sym) {
            pushErr(t, 'SIMBOLO_ESPERADO_FALTANTE', `Falta simbolo '${sym}' en ${desc}`);

            return null;
        }
        return adv();
    }

    function expectTipo (tipo, desc) {
        const t = at();
        if (!t || t.tipo !== tipo) {
            pushErr(t, 'FORMATO_INCORRECTO', `Se esperaba ${tipo} en ${desc}`);
            return null;
        }
        return adv();
    }

    function pushErr(t, tipo, descripcion) {
        const linea = t ? t.linea : 0;
        const columna = t ? t.columna : 0;
        const lexema = t ? t.lexema: '';
        ctx.modelo.errores_semanticos.push({ lexema, tipo, descripcion, linea, columna });
    }

    //validar "X-Y"
    function validarResultado(str) {
        //Debe tener un solo '-'
        let dash = -1;
        for (let i = 0; i < str.length; i++) { 
            if (str[i] === '-') { 
            dash = i; break;
            }
        }
        
        if ( dash <= 0 || dash >= str.length -  1) {
            return null;
        }

        // parse x
        let x = 0, y = 0;
        for (let i = 0; i < dash; i++) {
            const c = str[i];
            if (c < '0' || c > '9') return null;
            x = x * 10 + (c.charCodeAt(0) - 48);
        }

        // parse y
        for (let i = dash + 1; i < str.length; i++) {
            const c = str[i];
            if (c < '0' || c > '9') return null;
            y = y * 10 + (c.charCodeAt(0) - 48);
        }
        return { x, y };
    }

    //registrar stats de equipo
    function ensureEquipo(nombre) {
        if (!ctx.stats[nombre]) {
            ctx.stats[nombre] = { equipo: nombre, pj: 0, g: 0, p: 0, gf: 0, gc: 0, dg: 0, fase: '-'};
        }
    }

    function regPartido(fase, e1, e2, resStr) {
        ensureEquipo(e1); ensureEquipo(e2);
        let ganador = null;
        const vr = validarResultado(resStr);
        if (!vr) {
            // error de formato
            const t = at() || {linea: 0, columna: 0, lexema: resStr };
            pushErr(t, 'FORMATO_INCORRECTO', `Resultado inválido "${resStr}" (esperado "X-Y")`);
        } else {
            const { x, y} = vr;
            ctx.stats[e1].pj++; ctx.stats[e2].pj++;
            ctx.stats[e1].gf += x; ctx.stats[e1].gc += y; ctx.stats[e1].dg = ctx.stats[e1].gf - ctx.stats[e1].gc;
            ctx.stats[e2].gf += y; ctx.stats[e2].gc += x; ctx.stats[e2].dg = ctx.stats[e2].gf - ctx.stats[e2].gc;
            if ( x>y) { ctx.stats[e1].g++; ctx.stats[e2].p++; ganador = e1; }
            else if (y > x) { ctx.stats[e2].g++; ctx.stats[e1].p++; ganador = e2;}
            // no hay empates en eliminacion y si hubieran no sumamos g/p
        }

        ctx.modelo.partidos.push({ fase, e1, e2, resultado: resStr, ganador });
        // fase minima alcanzada y sobreescribe con la ultima fase vista
        ctx.stats[e1].fase = fase;
        ctx.stats[e2].fase = fase;
    }

    function regGol(jugador, equipo, minuto, tokRef) {
        if (minuto < 0 || (minuto|0) !== minuto) {
            pushErr(tokRef, 'FORMATO_INCORRECTO', `Minuto inválido (${minuto}) para goleador ${jugador}`);
            return;
        }
        const key = jugador + '|' + equipo;
        if (!ctx.goleadoresMap[key]) ctx.goleadoresMap[key] = { jugador, equipo, goles: 0, minutos: [] };
        ctx.goleadoresMap[key].goles++;
        ctx.goleadoresMap[key].minutos.push(minuto + "'");
    }

    // ---------- Parsers de alto nivel -----------
    function parseTorneo() {
        if (!expectRes('TORNEO', 'seccion TORNEO')) return;
        expectSym('{', 'TORNEO');

        // atributos esperados: nombre: "X", equipos: N, sede: "Y"
        while (hasNext() && !isSym('}')) {
            if(isRes('nombre')) {
                adv(); expectSym(':', 'nombre'); const cad = expectTipo('CADENA', 'nombre');
                if (cad) ctx.modelo.info['Nombre del Torneo'] = cad.lexema;
            } else if (isRes('equipos')) {
                adv(); expectSym(':', 'equipos'); const num = expectTipo('NUMERO', 'equipos');
                if (num) ctx.modelo.info['Equipos Participantes'] = parseInt(num.lexema, 10);
            } else if(isRes('sede')) {
                adv(); expectSym(':', 'sede'); const cad = expectTipo('CADENA', 'sede');
                if (cad) ctx.modelo.info['Sede'] = cad.lexema;
            } else {
                //consumir token para evitar un loop
                pushErr(at(), 'FORMATO_INCORRECTO', 'Atributo no reconocido en TORNEO');
                adv();
            }
            if (isSym(',')) adv();
        }

        expectSym('}', 'cierre TORNEO');
    }

    function parseEquipos() {
        if (!expectRes('EQUIPOS', 'seccion EQUIPOS')) return;
        expectSym('{', 'EQUIPOS');

        while (hasNext() && !isSym('}')) {
            if(isRes('equipo')) {
                adv(); expectSym(':', 'equipo'); const nombre = expectTipo('CADENA', 'nombre equipo');
                let eqName = nombre ? nombre.lexema : 'DESCONOCIDO';
                ensureEquipo(eqName);
                ctx.equipos[eqName] = ctx.equipos[eqName] || { jugadores: [] };

                // jugadores en [.....]
                expectSym('[', 'lista de jugadores');
                //estructura: jugador: "Nombre" [ posicion: "X", numero: N, edad: N], ...
                while (hasNext() && !isSym(']')) {
                    if (isRes('jugador')) {
                        adv(); expectSym(':', 'jugador'); const cadNom = expectTipo('CADENA', 'nombre jugador');
                        const jugName = cadNom ? cadNom.lexema : '???';
                        expectSym('[', 'detalles jugador');
                        // leer pares atributo: valor, separandolos por coma
                        let pos = null, numero = null, edad = null;
                        while (hasNext() && !isSym(']')) {
                            if (isRes('posicion')) { adv(); expectSym(':','posicion'); const c = expectTipo('CADENA','posicion'); pos = c ? c.lexema : null; }
                            else if (isRes('numero')) { adv(); expectSym(':','numero'); const n = expectTipo('NUMERO','numero'); numero = n ? parseInt(n.lexema,10) : null; }
                            else if (isRes('edad'))   { adv(); expectSym(':','edad');   const n = expectTipo('NUMERO','edad');   edad = n ? parseInt(n.lexema,10) : null; }
                            else { pushErr(at(),'FORMATO_INCORRECTO','Atributo no reconocido en jugador'); adv(); }
                            if (isSym(',')) adv();
                        }
                        expectSym(']', 'cierre detalles jugador');

                        ctx.equipos[eqName].jugadores.push({ nombre: jugName, posicion: pos, numero, edad});
                    } else {
                        pushErr(at(), 'FORMATO_INCORRECTO', 'Elemento no reconocido en la lista de jugadores');
                        adv();
                    }
                    if (isSym(',')) adv();
                }
                expectSym(']', 'cierre lista jugadores');
            } else {
                pushErr(at(), 'FORMATO_INCORRECTO', 'Elemento no reconocido en EQUIPOS');
                adv();
            }
            if ( isSym(',')) adv();
        }

        expectSym('}', 'cierre EQUIPOS');
    }

    function parseEliminacion() {
        if (!expectRes('ELIMINACION', 'seccion ELIMINACION')) return;
        expectSym('{', 'ELIMINACION');

        while (hasNext() && !isSym('}')) {
            //cuartos, semifinal, final, etc
            if(isRes('cuartos') || isRes('semifinal') || isRes('final') || isRes('fase')) {
                const faseTok = adv();
                const fase = faseTok.lexema;
                expectSym(':', 'fase');

                // dentro de parseEliminacion(), ya después de leer 'fase' y ':'
                if (isSym('[')) {
                adv(); // abrir lista de partidos de la fase

                while (hasNext() && !isSym(']')) {
                    if (isRes('partido')) {
                    adv(); 
                    expectSym(':','partido');

                    const eq1 = expectTipo('CADENA','equipo 1'); 
                    const e1 = eq1 ? eq1.lexema : '???';

                    if (!isRes('vs')) pushErr(at(),'FORMATO_INCORRECTO','Falta palabra reservada vs');
                    else adv();

                    const eq2 = expectTipo('CADENA','equipo 2'); 
                    const e2 = eq2 ? eq2.lexema : '???';

                    expectSym('[','detalle partido');

                    let resStr = '-';
                    while (hasNext() && !isSym(']')) {
                        if (isRes('resultado')) {
                        adv(); expectSym(':','resultado'); 
                        const cad = expectTipo('CADENA','resultado "X-Y"');
                        resStr = cad ? cad.lexema : '-';
                        } else if (isRes('goleadores')) {
                        adv(); expectSym(':','goleadores'); 
                        expectSym('[','lista goleadores');

                        while (hasNext() && !isSym(']')) {
                            const jCad = expectTipo('CADENA','nombre goleador');
                            const jug = jCad ? jCad.lexema : '???';

                            expectSym('[','detalle goleador');
                            if (!isRes('minuto')) pushErr(at(),'FORMATO_INCORRECTO','Se esperaba atributo minuto');
                            else {
                            adv(); expectSym(':','minuto');
                            const n = expectTipo('NUMERO','minuto');
                            const minuto = n ? parseInt(n.lexema,10) : -1;
                            regGol(jug, inferEquipo(jug, e1, e2), minuto, n || at());
                            }
                            expectSym(']','cierre detalle goleador');

                            if (isSym(',')) adv();
                        }
                        expectSym(']','cierre lista goleadores');
                        } else {
                        pushErr(at(),'FORMATO_INCORRECTO','Atributo no reconocido en detalle de partido');
                        adv();
                        }
                        if (isSym(',')) adv();
                    }

                    expectSym(']','cierre detalle partido');
                    regPartido(fase, e1, e2, resStr); // registra partido

                    if (isSym(',')) adv();
                    } else {
                    pushErr(at(),'FORMATO_INCORRECTO','Elemento no reconocido en fase (se esperaba partido)');
                    adv();
                    if (isSym(',')) adv();
                    }
                }

                expectSym(']','cierre fase');
                } else {
                pushErr(at(),'FORMATO_INCORRECTO','Se esperaba "[" para fase');
                }

        } else {
            pushErr(at(),'FORMATO_INCORRECTO','Elemento no reconocido en ELIMINACION');
            adv();
        }
        if (isSym(',')) adv();
    }
        expectSym('}', 'cierre ELIMINACION');
    }


    // tratar de inferir equipo del goleador si pertenece a e1 o e2
    function inferEquipo(jugador, e1, e2) {
        // Busca la lista de jugadores por equipo
        if (ctx.equipos[e1]) {
        for (let i = 0; i < ctx.equipos[e1].jugadores.length; i++) {
            if (ctx.equipos[e1].jugadores[i].nombre === jugador) return e1;
        }
        }
        if (ctx.equipos[e2]) {
        for (let i = 0; i < ctx.equipos[e2].jugadores.length; i++) {
            if (ctx.equipos[e2].jugadores[i].nombre === jugador) return e2;
        }
        }
        // si no se encuentra, asigna por defecto al primero
        return e1;
    }

    // ---- ENTRADA PRINCIPAL ---
    while (hasNext()) {
        if (isRes('TORNEO'))       parseTorneo();
        else if (isRes('EQUIPOS')) parseEquipos();
        else if (isRes('ELIMINACION')) parseEliminacion();
        else { /* token suelto, consumir para evitar bucles */ adv(); }
    }

    // Stats en arreglos
    ctx.modelo.equiposStats = Object.values(ctx.stats);

    // Goleadores
    ctx.modelo.goleadores = Object.values(ctx.goleadoresMap);

    // Metricas generales
    const totalPartidos = ctx.modelo.partidos.length;
    let totalGoles = 0;
    for (let k = 0; k < ctx.modelo.goleadores.length; k++) totalGoles += ctx.modelo.goleadores[k].goles;

    ctx.modelo.info['Total de Partidos Programados'] = totalPartidos;
    ctx.modelo.info['Partidos Completados'] = totalPartidos; // si tu lenguaje tuviera pendientes, aquí se ajusta
    ctx.modelo.info['Total de Goles'] = totalGoles;
    ctx.modelo.info['Promedio de Goles por Partido'] = totalPartidos > 0 ? (totalGoles / totalPartidos).toFixed(2) : '0.00';
    // Fase actual: ultima fase vista 
    if (ctx.modelo.partidos.length) ctx.modelo.info['Fase Actual'] = ctx.modelo.partidos[ctx.modelo.partidos.length - 1].fase;

    return ctx.modelo;
    }

    module.exports = { parsear_modelo };

