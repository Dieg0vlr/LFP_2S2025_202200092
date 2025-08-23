const fs =requiree("fs");
const RegistroLlamada = require("./RegistroLlamada");

class CallCenter {
    constructor() {
        try {
            const data = fs.readFileSync(rutaArchivo, 'utf8');
            const lineas = data.split("\n"); //separar por lineas
            this.registros = lineas.map(linea => {
                const partes = linea.split(",");
                return new RegistroLlamada(parttes[0], partes[1], partes[2].trim(), partes[3], partes[4]);
            });
            console.log("Registros cargados correctamente");
        } catch (error) {
            console.error("Error al cargar los registros:", error);
        }
    }
    
    exportarHistorial() {
        const fs = require("fs");
        let html = "<table border='1'><tr><th>ID Operador</th><th>Nombre Operador</th><th>Estrellas</th><th>ID Cliente</th><th>Nombre Cliente</th><th>Clasificación</th></tr>";
        this.registros.forEach(registro => {
            html += `<tr>
                        <td>${registro.id_operador}</td>
                        <td>${registro.nombre_operador}</td>
                        <td>${registro.estrellas}</td>
                        <td>${registro.id_cliente}</td>
                        <td>${registro.nombre_cliente}</td>
                        <td>${registro.clasificar()}</td>
                    </tr>`;
        });
        html += "</table>";
        fs.writeFileSync("historial_llamadas.html", html, 'utf8');
        console.log("Historial exportado a historial_llamadas.html");
    }

    rendimientoOperadores() {
        const rendimiento = {};
        this.registros.forEach(registro => {
            if (!rendimiento[registro.id_operador]) {
                rendimiento[registro.id_operador] = {atendidas: 0, totales: 0};
            }
            rendimiento[registro.id_operador].totales++;
        });
    
        console.log("Rendimiento de los operadores:");
        Object.keys(rendimiento).forEach(id => {
            const operador = rendimiento[id];
            const porcentaje = (`Operador ${id}: ${porcentaje.toFixed(2)}% de llamadas atendidas.`);
            
        });

        const total = buenas + medias + malas;
        console.log(`Porcentaje de Llamadas Buenas: ${(buenas / total * 100).toFixed(2)}%`);
        console.log(`Porcentaje de Llamadas Medias: ${(medias / total * 100).toFixed(2)}%`);
        console.log(`Porcentaje de Llamadas Malas: ${(malas / total * 100).toFixed(2)}%`);

    }
}

module.exports = CallCenter;
               