const CallCenter = require('../Modelo/CallCenter');
const Menu = require('../Vista/Menu');

// Crear instancia del CallCenter
const callCenter = new CallCenter();

// Crear instancia del Menu y pasarle el CallCenter
const menu = new Menu(callCenter);

// Mostrar el menu 
menu.mostrarMenu();
