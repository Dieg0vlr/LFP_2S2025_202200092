class error_lexico {
    constructor(lexema, tipo, descripcion, linea, columna) {
        this.lexema = lexema;
        this.tipo = tipo; // TOKEN_INVALIDO, COMILLA_MAL_CERRADA, FORMATO_INCORRECTO
        this.descripcion = descripcion;
        this.linea = linea;
        this.columna = columna;
    }
}

module.exports = { error_lexico };