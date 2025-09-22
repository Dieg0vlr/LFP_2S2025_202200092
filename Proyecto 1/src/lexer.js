const { token, tipos_token } = require('./tokens');
const { error_lexico } = require('./errors');
const { reservadas } = require('./keywords');

class lexer {
    constructor(input) {
        this.input = input; // string completp
        this.i = 0;     //indice actual
        this.linea = 1;
        this.columna = 1;
        this.tokens = [];
        this.errores = [];
        this.pila = [];
    }        


    analizar() {
    while (!this._eof()) {
        const ch = this._peek();

        if (this._isWhitespace(ch)) { this._consumeWhitespace(); continue; } // Clasifica espacio en blanco
        if (this._isLetter(ch)) { this._scanIdent(); continue; } //Clasifica letra
        if (this._isDigit(ch))      { this._scanNumber();       continue; } // Clasifica digito
        if(ch === '"') { this._scanString(); continue; } // Clasifica comilla doble
        if (this._isSymbol(ch)) { this._emitSymbol(this._next()); continue; }

        // error en caso de ser cualquier otro caracter
        const startCol = this.columna;
        const bad = this._next();
        this.errores.push(new error_lexico(bad, 'TOKEN_INVALIDO', 'Caracter no reconocido', this.linea, startCol));
    }

    // valida aperturas sin cierre al final
    while (this.pila.length > 0) {
      const top = this.pila.pop();
      this.errores.push(new error_lexico(top.simbolo, 'SIMBOLO_ESPERADO_FALTANTE', 'Simbolo de cierre faltante', top.linea, top.columna));

    }

    return { tokens: this.tokens, errores: this.errores };
    }


    //-------------Escaneres--------------
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
    while (!this._eof() && this._isDigit(this._peek())) { lex += this._next(); }
    this.tokens.push(new token(tipos_token.NUMERO, lex, linea, col));
    }

    _scanString() {
    const linea = this.linea; const col = this.columna;
    let lex = '';
    this._next();
    let cerrado = false;
    while (!this._eof()) {
        const ch = this._next();
        if(ch === '"') { cerrado = true; break; }

        if (ch === '\\') {
            // permitir \" y \
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
        const linea = this.linea; const col = this.columna - 1; // aca ya avanzo

        // manejo de pila para {} y []
        if (sym === '{' || sym === '[') {
            this.pila.push({ simbolo: sym, linea, columna: col });
        } else if (sym === '}' || sym === ']') {
            const esperado = (sym === '}') ? '{' : '[';
            const top = this.pila.pop();
            if (!top || top.simbolo !== esperado) {
                // cierre sin apertura
                this.errores.push(new error_lexico(sym, 'SIMBOLO_ESPERADO_FALTANTE', `Se esperaba cierre para '${esperado}'`, linea, col));

            }
        }
            
        this.tokens.push(new token(tipos_token.SIMBOLO, sym, linea, col));

    }

    // ===== Helpers =====
    _isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
    }

    _isLetter(ch) {
        if (!ch) return false;
        const code = ch.charCodeAt(0);
        // A-Z
        if (code >= 65 && code <= 90) return true;
        // a-z
        if (code >= 97 && code <= 122) return true;
        // Ñ ñ
        if (code === 209 || code === 241) return true;
        // Á É Í Ó Ú  á é í ó ú
        switch (code) {
            case 193: case 201: case 205: case 211: case 218:
            case 225: case 233: case 237: case 243: case 250:
            return true;
        }
        return false;
        }
        
    _isDigit(ch) { return ch >= '0' && ch <= '9'; }
    _isSymbol(ch) {
        switch (ch) {
        case '{': case '}': case '[': case ']':
        case ':': case ',': case '-':
            return true;
        default:
            return false;
    }
  }

    _consumeWhitespace() {
        while (!this._eof() && this._isWhitespace(this._peek())) {
        const ch = this._next();
        if (ch === '\n') { this.linea++; this.columna = 1; }
        }
    }

    _peek() { return this.input[this.i]; }
    _next() { const ch = this.input[this.i++]; this.columna++; return ch; }
    _eof() { return this.i >= this.input.length; }
}

    module.exports = { lexer };