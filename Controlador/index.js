const fs = require("fs");

// funcion para cargar registros de un archivo
function cargarArchivo(rutaArchivo){
    try {
        const data = fs.readFileSync(rutaArchivo, 'utf8');
        const lineas = data.split("\n"); //separar por lineas
        const registros = lineas.map(linea => {
            const partes = linea.split(",");
            return {
                id_operador: partes[0],
                nombre_operador: partes[1],
                estrellas: partes[2].trim(), //limpiar espacios
                id_cliente: partes[3],
                nombre_clientes: partes[4],

            };
        });
        return registros;
    } catch (error) {
        console.error("Error al cargar el archivo:", error);
        return [];
    }
}

// Prueba con un archivo de ejemplo!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const registrosLlamadas = cargarArchivo("./data/archivo_llamadas.txt");
console.log(registrosLlamadas);