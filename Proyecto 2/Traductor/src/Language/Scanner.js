import Character from "../Utils/Character/Character.js";
import { errors } from "../Utils/Errors.js";

/**
 * @typedef {Object} Token
 * @property {string} lexeme - El lexema reconocido.
 * @property {string} type - Tipo de token (por ejemplo, 'TK_id', 'TK_int').
 * @property {number} line - Línea donde se encontró el token.
 * @property {number} column - Columna donde se encontró el token.
 */

export default class Scanner {
    /** @type {string} Entrada completa */
    #input;
    /** @type {number} Posición actual en el texto */
    #pos_char;
    /** @type {string} Buffer temporal */
    #buffer;
    /** @type {number} Línea actual */
    #char_line;
    /** @type {number} Columna actual */
    #char_col;
    /** @type {string} Último carácter leído */
    #next_char;
    /** @type {boolean} Indicador de lookahead */
    #is_look_ahead;
    /** @type {Object.<string,string>} Palabras clave */
    #keywords;

    /**
     * @param {string} input - Texto de entrada a analizar.
     */
    constructor(input) {
        this.#input = input.replace(/\r\n/g, '\n') + '\0';
        this.#pos_char = 0;
        this.#buffer = '';
        this.#char_line = 1;
        this.#char_col = 1;
        this.#next_char = '';
        this.#is_look_ahead = false;
        this.#keywords = {
        // Palabras reservadas estructurales
        public: 'KW_public',
        class: 'KW_class',
        static: 'KW_static',
        void: 'KW_void',
        main: 'KW_main',
        String: 'KW_String',
        args: 'KW_args',

        // Tipos de datos soportados
        int: 'KW_int',
        double: 'KW_double',
        char: 'KW_char',
        boolean: 'KW_boolean',

        // Booleanos
        true: 'KW_true',
        false: 'KW_false',

        // Estructuras de control
        if: 'KW_if',
        else: 'KW_else',
        for: 'KW_for',
        while: 'KW_while',

        // Impresion en consola
        System: 'KW_System',
        out: 'KW_out',
        println: 'KW_println',

        // Palabra clave de retorno
        return: 'KW_return'
    };

    }

    /**
     * @description Inicializa el buffer con un carácter y actualiza posición y columna.
     *
     * @param {string} current_char - Carácter actual a agregar al buffer.
     */
    #initBuffer(current_char) {
        this.#buffer = current_char;
        this.#char_col ++;
        this.#pos_char ++;
    }

    /**
     * @description Agrega un carácter al buffer y actualiza posición y columna.
     *
     * @param {string} current_char - Carácter a agregar al buffer.
     */
    #addBuffer(current_char) {
        this.#buffer += current_char;
        this.#char_col ++;
        this.#pos_char ++;
    }

    /**
     * @description Inicia el proceso de tokenización.
     *
     * @returns {Token} Token reconocido.
     */
    next_token = () => this.#S0();

    /**
     * @description Estado inicial del autómata.
     *
     * @returns {Token} Token reconocido o EOF.
     */
    #S0() {
        while((this.#next_char = this.#input[this.#pos_char]) !== '\0') {
            // TK_id | RW_[KEYWORD]
            if(Character.isAlpha(this.#next_char)) {
                this.#initBuffer(this.#next_char);
                return this.#S1();
            }

            // TK_str
            if(this.#next_char === '"') {
                this.#initBuffer(this.#next_char);
                return this.#S2();
            }

            // TK_char
            if(this.#next_char === '\'') {
                this.#initBuffer(this.#next_char);
                return this.#S4();
            }

            // TK_int | TK_float
            if(Character.isDigit(this.#next_char)) {
                this.#initBuffer(this.#next_char);
                /** @type {Token} */
                let tmpToken;
                if((tmpToken = this.#S7())) return tmpToken;
            }

            // >= | >> | >
            if(this.#next_char === '>') {
                this.#initBuffer(this.#next_char);
                return this.#S10();
            }

            // <= | <
            if(this.#next_char === '<') {
                this.#initBuffer(this.#next_char);
                return this.#S13();
            }

            // == | =
            if(this.#next_char === '=') {
                this.#initBuffer(this.#next_char);
                return this.#S15();
            }

            // !=
            if(this.#next_char === '!') {
                this.#initBuffer(this.#next_char);
                /** @type {Token} */
                let tmpToken;
                if((tmpToken = this.#S17())) return tmpToken;
            }

            // ++ | +
            if(this.#next_char === '+') {
                this.#initBuffer(this.#next_char);
                return this.#S19();
            }

            // ++ | +
            if(this.#next_char === '-') {
                this.#initBuffer(this.#next_char);
                return this.#S21();
            }

            // *
            if(this.#next_char === '*') {
                this.#initBuffer(this.#next_char);
                return this.#S23();
            }

            // [/][*][^*]*[*]+([^/*][^*]*[*]+)*[/] | [/][/][^\n]* | /
            if(this.#next_char === '/') {
                this.#initBuffer(this.#next_char);
                return this.#S24();
            }

            // (
            if(this.#next_char === '(') {
                this.#initBuffer(this.#next_char);
                return this.#S29();
            }

            // )
            if(this.#next_char === ')') {
                this.#initBuffer(this.#next_char);
                return this.#S30();
            }

            // {
            if(this.#next_char === '{') {
                this.#initBuffer(this.#next_char);
                return this.#S31();
            }

            // }
            if(this.#next_char === '}') {
                this.#initBuffer(this.#next_char);
                return this.#S32();
            }

            // ;
            if(this.#next_char === ';') {
                this.#initBuffer(this.#next_char);
                return this.#S33();
            }

            // ,
            if(this.#next_char === ',') {
                this.#initBuffer(this.#next_char);
                return this.#S34();
            }

            // [
            if (this.#next_char === '[') {
                this.#initBuffer(this.#next_char);
                return this.#S35();
            }

            // ]
            if (this.#next_char === ']') {
                this.#initBuffer(this.#next_char);
                return this.#S36();
            }

            // .
            if (this.#next_char === '.') {
                this.#initBuffer(this.#next_char);
                return this.#S37();
            }


            // CARACTERES IGNORADOS
            if(this.#next_char === ' ') {
                this.#char_col ++;
            }
            else if(this.#next_char === '\t') {
                this.#char_col += 4;
            }
            else if(this.#next_char === '\n') {
                this.#char_col = 1;
                this.#char_line ++;
            }
            // ERROR LÉXICO 
            else {
                this.#char_col ++;
                if(!this.#is_look_ahead) {
                    errors.push({ type: 'Lexical', message: `Caracter no reconocido «${this.#next_char}».`, line: this.#char_line, column: this.#char_col });
                }
            }

            this.#pos_char ++;
        }

        return { lexeme: 'EOF', type: `EOF`, line: this.#char_line, column: this.#char_col }; // End Of File: Final del archivo
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S1() {
        if(Character.isAlphaNumeric((this.#next_char = this.#input[this.#pos_char]))) {
            this.#addBuffer(this.#next_char);
            return this.#S1();
        }

        // Retorna el token reconocido
        return { lexeme: this.#buffer, type: this.#keywords[this.#buffer] || 'TK_id', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S2() {
        if((this.#next_char = this.#input[this.#pos_char]) !== '"' && this.#next_char !== '\n') {
            this.#addBuffer(this.#next_char);
            return this.#S2();
        }

        this.#addBuffer(this.#next_char);
        return this.#S3();
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S3() {
        return { lexeme: this.#buffer.substring(1, this.#buffer.length - 1), type: 'TK_str', line: this.#char_line, column: this.#char_col }; // Cadena
    }

    /**
     * @returns {Token} Token reconocido. '
     */
    #S4() {
        if((this.#next_char = this.#input[this.#pos_char]) !== '\'' && this.#next_char !== '\n') {
            this.#addBuffer(this.#next_char);
            return this.#S5();
        }

        // ERROR LÉXICO
        errors.push({ type: 'Lexical', message: `Patrón no reconocido «${this.#buffer}».`, line: this.#char_line, column: this.#char_col });
        return null;
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S5() {
        if((this.#next_char = this.#input[this.#pos_char]) === '\'') {
            this.#addBuffer(this.#next_char);
            return this.#S6();
        }

        // ERROR LÉXICO
        errors.push({ type: 'Lexical', message: `Patrón no reconocido «${this.#buffer}».`, line: this.#char_line, column: this.#char_col });
        return null;
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S6() {
        return { lexeme: this.#buffer.substring(1, this.#buffer.length - 1), type: 'TK_char', line: this.#char_line, column: this.#char_col }; // Cadena
    }

    #S7() {
        if(Character.isDigit((this.#next_char = this.#input[this.#pos_char]))) {
            this.#addBuffer(this.#next_char);
            return this.#S7();
        }

        if(this.#next_char === '.') {
            this.#addBuffer(this.#next_char);
            return this.#S8();
        }

        // Retorna el token reconocido
        return { lexeme: this.#buffer, type: 'TK_int', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S8() {
        if(Character.isDigit((this.#next_char = this.#input[this.#pos_char]))) {
            this.#addBuffer(this.#next_char);
            return this.#S9();
        }

        // ERROR LÉXICO
        errors.push({ type: 'Lexical', message: `Patrón no reconocido «${this.#buffer}».`, line: this.#char_line, column: this.#char_col });
        return null;
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S9() {
        if(Character.isDigit((this.#next_char = this.#input[this.#pos_char]))) {
            this.#addBuffer(this.#next_char);
            return this.#S9();
        }

        // Retorna el token reconocido
        return { lexeme: this.#buffer, type: 'TK_float', line: this.#char_line, column: this.#char_col };
    }

    #S10() {
        if((this.#next_char = this.#input[this.#pos_char]) === '>') {
            this.#addBuffer(this.#next_char);
            return this.#S11();
        }

        if((this.#next_char = this.#input[this.#pos_char]) === '=') {
            this.#addBuffer(this.#next_char);
            return this.#S12();
        }

        return { lexeme: this.#buffer, type: 'TK_greater', line: this.#char_line, column: this.#char_col };
    }

    #S11() {
        return { lexeme: this.#buffer, type: 'TK_arrow', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S12() {
        return { lexeme: this.#buffer, type: 'TK_grtequal', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S13() {
        if((this.#next_char = this.#input[this.#pos_char]) === '=') {
            this.#addBuffer(this.#next_char);
            return this.#S14();
        }

        return { lexeme: this.#buffer, type: 'TK_less', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S14() {
        return { lexeme: this.#buffer, type: 'TK_lsequal', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S15() {
        if((this.#next_char = this.#input[this.#pos_char]) === '=') {
            this.#addBuffer(this.#next_char);
            return this.#S16();
        }

        return { lexeme: this.#buffer, type: 'TK_assign', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S16() {
        return { lexeme: this.#buffer, type: 'TK_equal', line: this.#char_line, column: this.#char_col };
    }

    #S17() {
        if((this.#next_char = this.#input[this.#pos_char]) === '=') {
            this.#addBuffer(this.#next_char);
            return this.#S18();
        }

        // ERROR LÉXICO
        errors.push({ type: 'Lexical', message: `Caracter no reconocido «${this.#buffer}».`, line: this.#char_line, column: this.#char_col });
        return null;
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S18() {
        return { lexeme: this.#buffer, type: 'TK_notequal', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S19() {
        if((this.#next_char = this.#input[this.#pos_char]) === '+') {
            this.#addBuffer(this.#next_char);
            return this.#S20();
        }

        return { lexeme: this.#buffer, type: 'TK_add', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S20() {
        return { lexeme: this.#buffer, type: 'TK_inc', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S21() {
        if((this.#next_char = this.#input[this.#pos_char]) === '-') {
            this.#addBuffer(this.#next_char);
            return this.#S22();
        }

        return { lexeme: this.#buffer, type: 'TK_sub', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S22() {
        return { lexeme: this.#buffer, type: 'TK_dec', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S23() {
        return { lexeme: this.#buffer, type: 'TK_mul', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S24() {
        if((this.#next_char = this.#input[this.#pos_char]) === '*') {
            this.#addBuffer(this.#next_char);
            return this.#S25();
        }

        if((this.#next_char = this.#input[this.#pos_char]) === '/') {
            this.#addBuffer(this.#next_char);
            return this.#S28();
        }

        return { lexeme: this.#buffer, type: 'TK_div', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S25() {
        if((this.#next_char = this.#input[this.#pos_char]) !== '*') {
            this.#addBuffer(this.#next_char);
            if(this.#next_char === '\n') {
                this.#char_col = 1;
                this.#char_line ++;
            }
            return this.#S25();
        }

        this.#addBuffer(this.#next_char);
        return this.#S26();
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S26() {
        if((this.#next_char = this.#input[this.#pos_char]) !== '/') {
            this.#addBuffer(this.#next_char);
            if(this.#next_char === '\n') {
                this.#char_col = 1;
                this.#char_line ++;
            }
            return this.#S25();
        }

        this.#addBuffer(this.#next_char);
        return this.#S27();
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S27() {
        return { lexeme: this.#buffer, type: 'TK_comment', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S28() {
        if((this.#next_char = this.#input[this.#pos_char]) !== '\n') {
            this.#addBuffer(this.#next_char);
            return this.#S28();
        }

        this.#char_line ++;
        this.#char_col = 1;
        return { lexeme: this.#buffer, type: 'TK_single_comment', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S29() {
        return { lexeme: this.#buffer, type: 'TK_lpar', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S30() {
        return { lexeme: this.#buffer, type: 'TK_rpar', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S31() {
        return { lexeme: this.#buffer, type: 'TK_lbrc', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S32() {
        return { lexeme: this.#buffer, type: 'TK_rbrc', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S33() {
        return { lexeme: this.#buffer, type: 'TK_semicolon', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S34() {
        return { lexeme: this.#buffer, type: 'TK_comma', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S35() {
        return { lexeme: this.#buffer, type: 'TK_lbrk', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S36() {
        return { lexeme: this.#buffer, type: 'TK_rbrk', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @returns {Token} Token reconocido.
     */
    #S37() {
        return { lexeme: this.#buffer, type: 'TK_dot', line: this.#char_line, column: this.#char_col };
    }

    /**
     * @description Realiza un lookahead para previsualizar el siguiente token sin avanzar el scanner.
     *
     * @returns {Token} Token siguiente.
     */
    look_ahead() {
        let pos_char_aux = this.#pos_char;
        let char_line_aux = this.#char_line;
        let char_col_aux = this.#char_col;
        let next_char_aux = this.#next_char;
        let buffer_aux = this.#buffer;
        this.#is_look_ahead = true;
        let token = this.next_token();
        this.#pos_char = pos_char_aux;
        this.#char_line = char_line_aux;
        this.#char_col = char_col_aux;
        this.#next_char = next_char_aux;
        this.#buffer = buffer_aux;
        this.#is_look_ahead = false;
        return token;
    }
}