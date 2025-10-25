import Scanner from "../src/Language/Scanner.js";
import Parser from "../src/Language/Parser.js";
import { errors } from "../src/Utils/Errors.js";

// referencias
const entrada = document.getElementById("entrada");
const salida = document.getElementById("salida");
const consola = document.getElementById("consola");

// limpiar
document.getElementById("btnNuevo").onclick = () => {
    entrada.value = "";
    salida.value = "";
    consola.innerText = "";
    consola.style.display = "none"; 
};

// abrir archivo .java
document.getElementById("btnAbrir").onclick = () => {
    const inputFile = document.createElement("input");
    inputFile.type = "file";
    inputFile.accept = ".java,.txt";
    inputFile.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = evt => entrada.value = evt.target.result;
        reader.readAsText(file);
    };
    inputFile.click();
};

// guardar archivo .java
document.getElementById("btnGuardar").onclick = () => {
    const blob = new Blob([entrada.value], { type: "text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "codigo.java";
    a.click();
};

// traducir de java a python
document.getElementById("btnTraducir").onclick = () => {
  salida.value = "";
  consola.innerText = "";
  consola.style.display = "none";
  errors.length = 0;

  try {
    const sc = new Scanner(entrada.value);
    const parser = new Parser(sc);
    parser.parse();
    const py = parser.getPythonCode();
    salida.value = py;

    // alerta
    if (errors.length > 0) {
      alert("Traducción completada con advertencias. Revisa errores.html");
    } else {
      alert("✅ Traducción exitosa");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error durante la traduccion: " + err.message);
  }
};

// ver tokens
document.getElementById("btnVerTokens").onclick = () => {
    window.open("../Reports/tokens.html", "_blank");
};

// ver errores
document.getElementById("btnVerErrores").onclick = () => {
    window.open("../Reports/errores.html", "_blank");
};

// acerca de 
document.getElementById("btnAyuda").onclick = () => {
    alert("JavaBridge — Traductor Java a Python\nDesarrollado por: Diego Alberto Maldonado Galvez\nSeccion: Lenguajes Formales y de Programación 2S2025")
}

// ========== Simular ejecucion ==============
document.getElementById("btnSimular").onclick = async () => {
    consola.style.display = "block";
    consola.innerText = "⏳ Ejecutando output.py...\n";

    try {
    // ejecutando desde servidor local
    const { exec } = await import("child_process");
    const path = (await import("path")).default;
    const ruta = path.resolve("../Output/output.py");

    exec(`python "${ruta}"`, (error, stdout, stderr) => {
      if (error) {
        consola.innerText += `❌ Error: ${error.message}\n`;
        return;
      }
      if (stderr) consola.innerText += `⚠️ ${stderr}\n`;
      consola.innerText += `✅ Salida:\n${stdout}`;
    });
  } catch (e) {
    consola.innerText += "⚠️ Simulacion solo visual.\n(Ejecuta con Node o servidor local para salida real)";
  }
}