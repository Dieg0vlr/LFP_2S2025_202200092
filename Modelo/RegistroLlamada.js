class RegistroLlamada {
    constructor(id, fecha, hora, duracion, numero, tipo) {
        this.id_operador = id_operador;
        this.nombre_operador = nombre_operador;
        this.estrellas = estrellas;
        this.id_cliente = id_cliente;
        this.nombre_cliente = nombre_cliente; 

}

//Metodo para clasificar la llamada segun las estrellas
    clasificar(){
        const estrellasCount = this.estrellas.replace(/x/g, "").length;
        if (estrellasCount >= 4) {
            return "Buena";
        } else if (estrellasCount >= 2) {
            return "Media";
        } else {
            return "Mala";
        }
    }    
}

module.exports = RegistroLlamada;