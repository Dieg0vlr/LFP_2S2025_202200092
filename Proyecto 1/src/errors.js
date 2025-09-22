class error_lexico {
    constructor(lexema, tipo, descripcion, linea, columna) {
        this.lexema = lexema; // lo que causo el error
        this.tipo = tipo; // TOKEN_INVALIDO, COMILLA_MAL_CERRADA, FORMATO_INCORRECTO
        this.descripcion = descripcion;
        this.linea = linea; // en donde ocurrio
        this.columna = columna;
    }
}

module.exports = { error_lexico };