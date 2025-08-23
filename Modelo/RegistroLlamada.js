class RegistroLlamada {
    //el constructor recibe las 5 columnas del archivo
    constructor(id_operador, nombre_operador, estrellas, id_cliente, nombre_cliente) {
        //limpiamos por si vienen espacios
        this.id_operador = (id_operador ?? "").trim();
        this.nombre_operador = (nombre_operador ?? "").trim();
        //Usa x como estrellas y 0 si no hay estrella
        this.estrellas = (estrellas ?? "").trim();          // ej: "xxx00"
        this.id_cliente = (id_cliente ?? "").trim();
        this.nombre_cliente = (nombre_cliente ?? "").trim();
  }

//Metodo para clasificar la llamada segun las estrellas
    clasificar() {
        //Contamos cuantas x/numero de estrellas hay
         const n = (this.estrellas.match(/x/g) || []).length;
        if (n >= 4) return 'Buena'; // de 4 a 5
        if (n >= 2) return 'Media'; //de 2 a 3
        return 'Mala'; //de 0 a 1
    }
 
}

module.exports = RegistroLlamada;