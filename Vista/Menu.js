const readline = requiere('readline');

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
                case "3":
                    //exportar listado de operadores
                case "4":
                    //exportar lista de clientes
                case "5":
                    this.callCenter.rendimientoOperadores();
                case "6":
                    this.callCenter.mostrarPorcentajeClasificacion();
                    break
                case "7":
                    //Mostrar cantidad de llamadas por calificacion
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

        this.callCenter.cargarArchivo("./data/archivo_llamadas.txt")
        console.log("Registros cargados correctamente")
        this.mostrarMenu();
    }
}

module.exports = Menu;