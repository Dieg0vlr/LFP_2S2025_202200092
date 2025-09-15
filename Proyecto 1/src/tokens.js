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

module.exports = { token, tipos_token };