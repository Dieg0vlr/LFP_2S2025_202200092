const readline = require('readline');

class Menu {
    constructor(callCenter) {
        this.callCenter = callCenter;
        this.rl = readline.createInterface({

            input: process.stdin,
            output: process.stdout
        });
    }
    

    mostrarMenu() {
        console.log("\n---- MENU PRINCIPAL ----");
        console.log("1. Cargar Registros de Llamadas");
        console.log("2. Exportar Historial de Llamadas");
        console.log("3. Exportar Listado de Operadores");
        console.log("4. Exportar Listado de Clientes");
        console.log("5. Exportar Rendimiento de Operadores");
        console.log("6. Mostrar Porcentaje de Clasificación de Llamadas");
        console.log("7. Mostrar Cantidad de Llamadas por Calificación");
        console.log("8. Salir");

        this.rl.question("Seleccione una opcion: ", (opcion) => {
            switch (opcion) {
                case "1":
                    this.cargarRegistros();
                    break;
                case "2":
                    this.callCenter.exportarHistorial();
                    this.mostrarMenu();
                    break;
                case "3":
                    this.callCenter.exportarListadoOperadores();
                    this.mostrarMenu();
                    break;
                case "4":
                    this.callCenter.exportarListadoClientes();
                    this.mostrarMenu();
                    break;
                case "5":
                    this.callCenter.rendimientoOperadores();
                    this.mostrarMenu();
                    break;
                case "6":
                    this.callCenter.mostrarPorcentajeClasificacion();
                    this.mostrarMenu();
                    break
                case "7":
                    this.callCenter.mostrarCantidadPorCalificacion();
                    this.mostrarMenu();
                    break
                case "8":
                    this.rl.close();
                    break
                default:
                    console.log("Opcion no valida");
                    this.mostrarMenu();
                    break;    
            }
        });
    }

    cargarRegistros() {
    this.rl.question("Ingrese la ruta del archivo de llamadas: ", (ruta) => {
        this.callCenter.cargarArchivo(ruta);
        this.mostrarMenu();
    });
}

}

module.exports = Menu;