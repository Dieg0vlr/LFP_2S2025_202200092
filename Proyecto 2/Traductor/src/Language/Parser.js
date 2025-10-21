import { errors } from "../Utils/Errors.js";

/**
 * @typedef {Object} Token
 * @property {string} lexeme
 * @property {string} type
 * @property {number} line
 * @property {number} column
 */

export default class Parser {
    /** @type {any} */
    #sc;
    /** @type {Token|null} */
    #current_token;

    // acumulador de salida python
    #salida_py = [];
    #indent = 0;

    // tipo actual en declaraciones
    #tipo_actual = null;

    constructor(sc) {
        this.#sc = sc;
    }

    // api publica
    parse() {
        this.#START();
    }

    getPythonCode() {
        return this.#salida_py.join("\n");
    }

    // util de salida
    #emitir(linea) {
        this.#salida_py.push("    ".repeat(this.#indent) + linea);
    }
    #indent_mas() { this.#indent++; }
    #indent_menos() { if (this.#indent > 0) this.#indent--; }

    // ==================== GRAMATICA ====================

    #START() {
        // <START> ::= <CLASSDECL> EOF
        this.#CLASSDECL();
        this.#consume('EOF');
    }

    /**
     * <CLASSDECL> ::= 'public' 'class' TK_id '{'
     *                    'public' 'static' 'void' 'main' '(' 'String' '[' ']' 'args' ')' '{'
     *                        <INSTRUCTION>*
     *                    '}'
     *                '}'
     */
    #CLASSDECL() {
        this.#consume('KW_public');
        this.#consume('KW_class');
        this.#consume('TK_id'); // nombre clase
        this.#consume('TK_lbrc');

        this.#consume('KW_public');
        this.#consume('KW_static');
        this.#consume('KW_void');
        this.#consume('KW_main');
        this.#consume('TK_lpar');
        this.#consume('KW_String');
        this.#consume('TK_lbrk');
        this.#consume('TK_rbrk');
        this.#consume('KW_args');
        this.#consume('TK_rpar');
        this.#consume('TK_lbrc');

        // cuerpo main -> en python no se usa if __name__ 
        while(this.#match(
            'KW_int','KW_double','KW_char','KW_boolean','KW_String',
            'TK_id','KW_if','KW_for','KW_while','KW_System',
            'TK_comment','TK_single_comment'
        )) {
            if (this.#match('TK_comment','TK_single_comment')) {
                this.#consume(this.#current_token.type);
            } else {
                this.#INSTRUCTION();
            }
        }

        this.#consume('TK_rbrc'); // fin main
        this.#consume('TK_rbrc'); // fin class
    }

    #INSTRUCTION() {
        // declaraciones
        if (this.#match('KW_int','KW_double','KW_char','KW_boolean','KW_String')) {
            this.#INITVAR();
            return;
        }
        // asignacion
        if (this.#match('TK_id')) {
            this.#ASSIGNVAR();
            return;
        }
        // if
        if (this.#match('KW_if')) { this.#IF(); return; }
        // for
        if (this.#match('KW_for')) { this.#FOR(); return; }
        // while
        if (this.#match('KW_while')) { this.#WHILE(); return; }
        // print
        if (this.#match('KW_System')) { this.#PRINT(); return; }
    }

    // ========== declaraciones y asignaciones ==========

    // <INITVAR> ::= <TYPE> TK_id ('=' <EXP>)? (',' TK_id ('=' <EXP>)?)* ';'
    #INITVAR() {
        const tipo = this.#TYPE(); // guarda tipo
        // primer id
        let id = this.#consume('TK_id');
        if (!id) return;
        if (this.#match('TK_assign')) {
            this.#consume('TK_assign');
            const exp = this.#EXP_py();
            this.#emitir(`${id.lexeme} = ${exp.code}`);
        } else {
            this.#emitir(`${id.lexeme} = ${this.#valor_por_defecto(tipo)}`);
        }

        // mas declaradores
        while (this.#match('TK_comma')) {
            this.#consume('TK_comma');
            id = this.#consume('TK_id');
            if (!id) break;
            if (this.#match('TK_assign')) {
                this.#consume('TK_assign');
                const exp = this.#EXP_py();
                this.#emitir(`${id.lexeme} = ${exp.code}`);
            } else {
                this.#emitir(`${id.lexeme} = ${this.#valor_por_defecto(tipo)}`);
            }
        }

        this.#consume('TK_semicolon');
    }

    // <ASSIGNVAR> ::= TK_id '=' <EXP> ';'
    #ASSIGNVAR() {
        const id = this.#consume('TK_id');
        this.#consume('TK_assign');
        const exp = this.#EXP_py();
        this.#emitir(`${id.lexeme} = ${exp.code}`);
        this.#consume('TK_semicolon');
    }

    // ========== estructuras de control ==========

    // <IF> ::= 'if' '(' <EXP> ')' <BLOCK> ('else' <BLOCK>)?
    #IF() {
        this.#consume('KW_if');
        this.#consume('TK_lpar');
        const cond = this.#EXP_py();
        this.#consume('TK_rpar');

        this.#emitir(`if ${cond.code}:`);
        this.#BLOCK_py_body(); // escribe bloque con indent

        if (this.#match('KW_else')) {
            this.#consume('KW_else');
            this.#emitir(`else:`);
            this.#BLOCK_py_body();
        }
    }

    // <WHILE> ::= 'while' '(' <EXP> ')' <BLOCK>
    #WHILE() {
        this.#consume('KW_while');
        this.#consume('TK_lpar');
        const cond = this.#EXP_py();
        this.#consume('TK_rpar');

        this.#emitir(`while ${cond.code}:`);
        this.#BLOCK_py_body();
    }

    /**
     * <FOR> ::= 'for' '(' (<TYPE> TK_id ('=' <EXP>)? | TK_id '=' <EXP>) ';' <EXP> ';' <INCDEC> ')' <BLOCK>
     * Traduccion: init; while cond: { body; step; }
     */
    #FOR() {
        this.#consume('KW_for');
        this.#consume('TK_lpar');

        let init_line = null;
        if (this.#match('KW_int','KW_double','KW_char','KW_boolean','KW_String')) {
            const tipo = this.#TYPE();
            const id = this.#consume('TK_id');
            if (this.#match('TK_assign')) {
                this.#consume('TK_assign');
                const e = this.#EXP_py();
                init_line = `${id.lexeme} = ${e.code}`;
            } else {
                init_line = `${id.lexeme} = ${this.#valor_por_defecto(tipo)}`;
            }
        } else {
            const id = this.#consume('TK_id');
            this.#consume('TK_assign');
            const e = this.#EXP_py();
            init_line = `${id.lexeme} = ${e.code}`;
        }
        this.#consume('TK_semicolon');

        const cond = this.#EXP_py();
        this.#consume('TK_semicolon');

        // step (inc/dec)
        const step_id = this.#consume('TK_id');
        let step_line = null;
        if (this.#match('TK_inc')) {
            this.#consume('TK_inc');
            step_line = `${step_id.lexeme} = ${step_id.lexeme} + 1`;
        } else if (this.#match('TK_dec')) {
            this.#consume('TK_dec');
            step_line = `${step_id.lexeme} = ${step_id.lexeme} - 1`;
        } else {
            // si no fue ++/-- intentamos += o similar en el futuro
            errors.push({ type:'Syntax', message:`Se esperaba ++ o --`, line: step_id.line, column: step_id.column });
        }

        this.#consume('TK_rpar');

        // traduccion
        this.#emitir(init_line);
        this.#emitir(`while ${cond.code}:`);
        // cuerpo
        this.#indent_mas();
        this.#consume('TK_lbrc');
        while(this.#match(
            'KW_int','KW_double','KW_char','KW_boolean','KW_String',
            'TK_id','KW_if','KW_for','KW_while','KW_System',
            'TK_comment','TK_single_comment'
        )) {
            if (this.#match('TK_comment','TK_single_comment')) {
                this.#consume(this.#current_token.type);
            } else {
                this.#INSTRUCTION();
            }
        }
        this.#consume('TK_rbrc');
        // step al final del while
        this.#emitir(step_line);
        this.#indent_menos();
    }

    // <BLOCK> ::= '{' <INSTRUCTION>* '}'
    // variante que emite indentacion python
    #BLOCK_py_body() {
        this.#consume('TK_lbrc');
        this.#indent_mas();
        while(this.#match(
            'KW_int','KW_double','KW_char','KW_boolean','KW_String',
            'TK_id','KW_if','KW_for','KW_while','KW_System',
            'TK_comment','TK_single_comment'
        )) {
            if (this.#match('TK_comment','TK_single_comment')) {
                this.#consume(this.#current_token.type);
            } else {
                this.#INSTRUCTION();
            }
        }
        this.#consume('TK_rbrc');
        this.#indent_menos();
    }

    // impresion
    // <PRINT> ::= 'System' '.' 'out' '.' 'println' '(' <EXP> ')' ';'
    #PRINT() {
        this.#consume('KW_System');
        this.#consume('TK_dot');
        this.#consume('KW_out');
        this.#consume('TK_dot');
        this.#consume('KW_println');
        this.#consume('TK_lpar');
        const e = this.#EXP_py();
        this.#consume('TK_rpar');
        this.#consume('TK_semicolon');

        this.#emitir(`print(${e.code})`);
    }

    // tipos
    #TYPE() {
        if (this.#match('KW_int'))  { this.#consume('KW_int');  return 'int'; }
        if (this.#match('KW_double')) { this.#consume('KW_double'); return 'double'; }
        if (this.#match('KW_char')) { this.#consume('KW_char'); return 'char'; }
        if (this.#match('KW_boolean')) { this.#consume('KW_boolean'); return 'boolean'; }
        if (this.#match('KW_String')) { this.#consume('KW_String'); return 'String'; }
        // error si no coincide
        errors.push({ type:'Syntax', message:`Tipo no reconocido`, line:this.#current_token.line, column:this.#current_token.column });
        return 'unknown';
    }

    #valor_por_defecto(tipo) {
        switch (tipo) {
            case 'int': return '0';
            case 'double': return '0.0';
            case 'char': return "''";
            case 'String': return '""';
            case 'boolean': return 'False';
            default: return 'None';
        }
    }

    // ==================== EXPRESIONES (retornan {code, isString}) ====================

    // <EXP> ::= <EXP2> (('==' | '!=' | '<=' | '>=' | '<' | '>') <EXP2>)*
    #EXP_py() {
        let izq = this.#EXP2_py();
        while (this.#match('TK_equal','TK_notequal','TK_lsequal','TK_grtequal','TK_less','TK_greater')) {
            const opTok = this.#current_token;
            this.#consume(opTok.type);
            const der = this.#EXP2_py();
            const op = this.#map_op(opTok.type);
            izq = { code: `(${izq.code} ${op} ${der.code})`, isString: false };
        }
        return izq;
    }

    // <EXP2> ::= <EXP1> (('+' | '-') <EXP1>)*
    #EXP2_py() {
        let izq = this.#EXP1_py();
        while (this.#match('TK_add','TK_sub')) {
            const opTok = this.#current_token;
            this.#consume(opTok.type);
            const der = this.#EXP1_py();

            if (opTok.type === 'TK_add') {
                const isStr = izq.isString || der.isString;
                let L = izq.code, R = der.code;
                if (izq.isString && !der.isString) R = `str(${R})`;
                if (der.isString && !izq.isString) L = `str(${L})`;
                izq = { code: `(${L} + ${R})`, isString: isStr };
            } else {
                // resta no es string
                izq = { code: `(${izq.code} - ${der.code})`, isString: false };
            }
        }
        return izq;
    }

    // <EXP1> ::= <PRIMITIVE> (('*' | '/') <PRIMITIVE>)*
    #EXP1_py() {
        let izq = this.#PRIMITIVE_py();
        while (this.#match('TK_mul','TK_div')) {
            const opTok = this.#current_token;
            this.#consume(opTok.type);
            const der = this.#PRIMITIVE_py();
            const op = (opTok.type === 'TK_mul') ? '*' : '/';
            izq = { code: `(${izq.code} ${op} ${der.code})`, isString: false };
        }
        return izq;
    }

    /*
     <PRIMITIVE> ::=
        TK_id | TK_int | TK_float | TK_str | TK_char | 'true' | 'false'
    */
    #PRIMITIVE_py() {
        if (this.#match('TK_id')) {
            const t = this.#consume('TK_id');
            return { code: t.lexeme, isString: false };
        }
        if (this.#match('TK_int')) {
            const t = this.#consume('TK_int');
            return { code: t.lexeme, isString: false };
        }
        if (this.#match('TK_float')) {
            const t = this.#consume('TK_float');
            return { code: t.lexeme, isString: false };
        }
        if (this.#match('TK_str')) {
            const t = this.#consume('TK_str'); // viene sin comillas desde scanner
            return { code: JSON.stringify(t.lexeme), isString: true };
        }
        if (this.#match('TK_char')) {
            const t = this.#consume('TK_char'); // viene sin comillas
            return { code: JSON.stringify(t.lexeme), isString: true };
        }
        if (this.#match('KW_true')) { this.#consume('KW_true'); return { code:'True', isString:false }; }
        if (this.#match('KW_false')) { this.#consume('KW_false'); return { code:'False', isString:false }; }

        errors.push({ type:'Syntax', message:`Token no valido en expresion «${this.#current_token.lexeme}»`, line:this.#current_token.line, column:this.#current_token.column });
        // devolvemos algo neutro para no romper
        this.#consume(this.#current_token.type);
        return { code:'None', isString:false };
    }

    #map_op(t) {
        switch (t) {
            case 'TK_equal': return '==';
            case 'TK_notequal': return '!=';
            case 'TK_lsequal': return '<=';
            case 'TK_grtequal': return '>=';
            case 'TK_less': return '<';
            case 'TK_greater': return '>';
            default: return '??';
        }
    }

    // ==================== helpers de parser ====================

    #consume(...types) {
        if (this.#match(...types)) {
            return this.#sc.next_token();
        }
        errors.push({ type: 'Syntax', message: `No se esperaba «${this.#current_token?.lexeme}»`, line: this.#current_token?.line, column: this.#current_token?.column });
        return null;
    }

    #match(...types) {
        this.#current_token = this.#sc.look_ahead();
        return types.includes(this.#current_token.type);
    }
}
