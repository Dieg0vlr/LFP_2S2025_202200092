import fs from 'fs';
import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

export default class IO {
    /**
     * @description Solicita al usuario una entrada desde la consola y devuelve una promesa que se resuelve
     * @param {string} msg - Mensaje que se muestra al usuario para solicitar la entrada
     * @returns {Promise<string>} - Promesa que resuelve con la entrada del usuario
     * 
     * @example
     * const reader = new Reader();
     * reader.readInput('Ingrese su nombre: ').then((nombre) => {
     *   console.log(`Hola, ${nombre}!`);
     *   reader.close();
     * })
     * 
     * @example
     * const reader = new Reader();
     * const nombre = await reader.readInput('Ingrese su nombre: ');
     * console.log(`Hola, ${nombre}!`);
     * reader.close();
     */
    readInput = (msg) => {
        return new Promise((resolve) => {
            rl.question(`${msg}`, (input) => {
                resolve(input);
            });
        });
    }

    /**
     * @description Lee un archivo y devuelve su contenido como una cadena de texto.
     * @param {string} filePath - Ruta del archivo a leer
     * @param {string} [encoding='utf-8'] - Codificación del archivo (opcional, por defecto 'utf-8')
     * @returns {[string|null, Error|null]} Una tupla [contenido, error].
     * 
     * @example
     * const reader = new Reader();
     * const contenido = reader.readFile('./path/to/file.txt');
     * console.log(contenido);
    */
    readFile = (filePath, encoding = 'utf-8') => {
        try {
            return [fs.readFileSync(filePath, encoding), null];
        } catch (error) {
            return [null, error];
        }
    }

    /**
     * @description Cierra la interfaz de lectura de la consola (`readline`).
     * @returns {void}
     *
     * @example
     * const reader = new Reader();
     * reader.close();
     */
    close = () => {
        rl.close();
    }
}