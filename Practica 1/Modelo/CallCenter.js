const fs = require("fs");
const RegistroLlamada = require("./RegistroLlamada");

class CallCenter {
    constructor() {
        this.registros = []; //arreglo donde se guardan los registros del archivo cargado
    }

    //Lee el arhivo y parseacada linea
    //Crea instancias de RegistroLlamada
    cargarArchivo(rutaArchivo){
        try {
            const data = fs.readFileSync(rutaArchivo, 'utf8');
            const lineas = data.split("\n"); //separar por lineas
            this.registros = lineas.map(linea => {
                //Separa por coma 
                const partes = linea.split(",");
                //crea un ojeto registroLlamada y lo retorna
                return new RegistroLlamada(partes[0], partes[1], partes[2].trim(), partes[3], partes[4]);
            });
            console.log("Registros cargados correctamente");
        } catch (error) {
            console.error("Error al cargar los registros:", error);
        }
    }
    
    //Exporta una tabla HTML con el historial
    exportarHistorial() {
        // Validar si hay registros cargados
        if(this.registros.length === 0){
        console.log("No hay registros cargados. Por favor cargue primero un archivo");
        return;
        }

        //Generar HTML con titulo y tabña
        let html = `
    <table border="1" cellspacing="0" cellpadding="5">
    <tr>
        <th>ID Operador</th>
        <th>Nombre Operador</th>
        <th>Estrellas</th>
        <th>ID Cliente</th>
        <th>Nombre Cliente</th>
        <th>Clasificación</th>
    </tr>`;

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

        //Guardar archivo HTML
        fs.writeFileSync("historial_llamadas.html", html, 'utf8');
        console.log("Historial exportado a historial_llamadas.html");
    }

    //Muestra el % de llamadas buenas por operador
    //atendidas = Buena
    rendimientoOperadores() {
    if (this.registros.length === 0) {
      console.log("No hay registros cargados. Cargue un archivo primero.");
      return;
    }
    //Estructura id_operador: atendidas, totales, nombre
    const rendimiento = {}; //objeto vacio y se llena dependiendo del id
    this.registros.forEach(registro => {
        if (!rendimiento[registro.id_operador]) {
            rendimiento[registro.id_operador] = { atendidas: 0, totales: 0 };
        }
        rendimiento[registro.id_operador].totales++;
        if (registro.clasificar() === 'Buena') {
            rendimiento[registro.id_operador].atendidas++;
        }
    });

    console.log("Rendimiento de los operadores:");
    Object.keys(rendimiento).forEach(id => {
        const operador = rendimiento[id];
        const porcentaje = (operador.atendidas / operador.totales) * 100;
        console.log(`Operador ${id}: ${porcentaje.toFixed(2)}% de llamadas atendidas.`);
    });
}


    // Listado de operadores sin duplicar
    exportarListadoOperadores(){
        if (this.registros.length === 0) {
        console.log("No hay registros cargados. Cargue un archivo primero.");
        return;
        }

        //Obtener operadores unicos
        const operadoresUnicos = []; //arreglo de operadores
        this.registros.forEach(r => {
            if (!operadoresUnicos.some(o => o.id_operador === r.id_operador)) {
                operadoresUnicos.push({id_operador: r.id_operador, nombre_operador: r.nombre_operador});
            }
        });

        //Generar html
        let html = "<table border='1'><tr><th>ID Operador</th><th>Nombre Operador</th></tr>";
        operadoresUnicos.forEach(o => {
            html += `<tr><td>${o.id_operador}</td><td>${o.nombre_operador}</td></tr>`;
        });
        html += "</table>";
        
        fs.writeFileSync("listado_operadores.html", html, "utf-8");
        console.log("Listado de operadores exportado a listado_operadores.html")
    }

    // Listado de clientes unicos (exporta en html)
    exportarListadoClientes() {
        if (this.registros.length === 0) {
        console.log("No hay registros cargados. Cargue un archivo primero.");
        return;
        }

        const clientesUnicos = [];
        this.registros.forEach(r =>{
            if (!clientesUnicos.some(c => c.id_cliente === r.id_cliente)) {
                clientesUnicos.push({id_cliente: r.id_cliente, nombre_cliente: r.nombre_cliente});
            }
        });

        let html = "<table border='1'><tr><th>ID Cliente</th><th>Nombre Cliente</th></tr>";
        clientesUnicos.forEach(c => {
            html += `<tr><td>${c.id_cliente}</td><td>${c.nombre_cliente}</td></tr>`;
        });
        html += "</table>";

        fs.writeFileSync("listado_clientes.html", html, "utf-8");
        console.log("Listado de clientes exportado a listado_clientes.html");
    }

    //Muestra cantidad de llamadas por calificacion (estrellas)
    mostrarCantidadPorCalificacion() {
        if (this.registros.length === 0) {
        console.log("No hay registros cargados. Cargue un archivo primero.");
        return;
        }

        const contador = {1:0, 2:0, 3:0, 4:0, 5:0}; //Objeto que guarda cuantas llamadas hay con tantas estrellas
        this.registros.forEach(r => {
            const estrellas = (r.estrellas.match(/x/g) || []).length;
            if (contador[estrellas] !== undefined) {
                contador[estrellas]++;
            }
        });

        console.log("Cantidad de llamadas por calificacion:");
        //devuelve un arreglo con las llaves del objeto para acceder a su valor (contador)
        Object.keys(contador).forEach(k => {
            console.log(`${k} estrella(s): ${contador[k]} llamada(s)`);
        });
    }

    //Muestra % de llamadas por categoria
    mostrarPorcentajeClasificacion() {
        if (this.registros.length === 0) {
        console.log("No hay registros cargados. Cargue un archivo primero.");
        return;
        }

        let buenas = 0,medias = 0, malas = 0;
        
        this.registros.forEach(r => {
            const clasificacion = r.clasificar();
            if(clasificacion === "Buena") buenas++;
            else if (clasificacion === "Media") medias++;
            else malas++;
        });

        const total = buenas + medias + malas;
        if(total === 0) {
            console.log("No hay registros cargados");
            return;
        }

        console.log(`Porcentaje de llamadas Buenas: ${(buenas/total*100).toFixed(2)}%`);
        console.log(`Porcentaje de llamadas Medias: ${(medias/total*100).toFixed(2)}%`);
        console.log(`Porcentaje de llamadas Malas: ${(malas/total*100).toFixed(2)}%`);
    }
}

module.exports = CallCenter; //exporta la clase para usarla en otros archivos
               