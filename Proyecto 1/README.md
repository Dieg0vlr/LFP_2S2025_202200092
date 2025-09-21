PROYECTO 1 – LFP 2S2025
Analizador Léxico y Generador de Reportes para Torneos Deportivos

Descripcion
Aplicacion desarrollada en JavaScript que analiza archivos de texto con la descripcion de un torneo,
genera tokens y errores lexicos, y produce reportes en HTML y diagramas en Graphviz (DOT).

Requisitos
- Node.js instalado (para ejecutar el proyecto con main.js).
- Navegador moderno (para abrir la version en public/index.html).
- Opcional: Graphviz para convertir archivos .dot a imagenes.

Estructura del proyecto
PROYECTO 1/
  ejemplos/
  out/
  src/
    public/
      app.js
      index.html
    reporters/
      graphviz.js
      html_report.js
      html_strings.js
      utils.js
      errors.js
      keywords.js
      lexer.js
    main.js
    parser.js
    tokens.js
  package.json
  package-lock.json

Ejecucion
1. En consola, situarse en la carpeta src.
2. Ejecutar: node main.js ejemplos/archivo.txt
   - Esto analiza el archivo y genera tokens/errores.
3. O bien, abrir src/public/index.html en un navegador
   - Cargar un archivo de entrada y usar los botones Analizar, Generar DOT y Exportar.
4. Los reportes HTML se encuentran en la carpeta out.
5. El archivo bracket.dot se puede convertir a PNG con:
   dot -Tpng bracket.dot -o bracket.png

Ejemplo de entrada
TORNEO { nombre: "Copa Mundial Universitaria", equipos: 4 }
EQUIPOS {
  equipo: "Leones FC" [jugador: "Pedro", jugador: "Mario"]
  equipo: "Aguilas United" [jugador: "Sofia", jugador: "Diego"]
}
ELIMINACION {
  cuartos: [
    partido: "Leones FC" vs "Aguilas United" [resultado: "2-1", goleadores: ["Pedro","Sofia","Mario"]]
  ]
}

Autores
Nombre: TU_NOMBRE
Carnet: TU_CARNET

Notas
- Proyecto desarrollado sin expresiones regulares, sin .split/.match/.replace.
- Todo el analisis se hace caracter por caracter con funciones nativas del lenguaje.
- El diagrama DOT puede visualizarse con Graphviz o en https://dreampuf.github.io/GraphvizOnline/
