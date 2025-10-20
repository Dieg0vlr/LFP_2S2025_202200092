/**
 * @description Verifica si un carácter dado es una letra alfabética (A-Z o a-z).
 *
 * @param {string} char - El carácter a verificar. Debe ser una cadena de un solo carácter.
 * @returns {boolean} `true` si el carácter es una letra alfabética, de lo contrario `false`.
 */
const isAlpha = (char) =>
    // A-Z
    (char.charCodeAt(0) >= 65 && char.charCodeAt(0) <= 90) ||
    // a-z
    (char.charCodeAt(0) >= 97 && char.charCodeAt(0) <= 122);

/**
 * @description Verifica si un carácter dado es un dígito numérico (0-9).
 *
 * @param {string} char - El carácter a verificar. Debe ser una cadena de un solo carácter.
 * @returns {boolean} `true` si el carácter es un dígito, de lo contrario `false`.
 */
const isDigit = (char) =>
    // 0-9
    char.charCodeAt(0) >= 48 && char.charCodeAt(0) <= 57;

/**
 * @description Verifica si un carácter dado es alfanumérico (A-Z, a-z, 0-9).
 *
 * @param {string} char - El carácter a verificar. Debe ser una cadena de un solo carácter.
 * @returns {boolean} `true` si el carácter es alfanumérico, de lo contrario `false`.
 */
const isAlphaNumeric = (char) =>
    // A-Z a-z 0-9
    isAlpha(char) || isDigit(char);

/**
 * Objeto utilitario para verificar propiedades de caracteres.
 *
 * @namespace Character
 * @property {function(string): boolean} isAlpha - Verifica si un carácter es una letra.
 * @property {function(string): boolean} isDigit - Verifica si un carácter es un dígito.
 * @property {function(string): boolean} isAlphaNumeric - Verifica si un carácter es alfanumérico.
 */
const Character = {
    isAlpha,
    isDigit,
    isAlphaNumeric
};

export default Character;