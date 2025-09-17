const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const { lexer } = require('./lexer');
const { parsear_modelo } = require('./parser');             
const { guardar_tokens_html, guardar_errores_html, guardar_resumen_html } = require('./reporters/html_report');
const { guardar_bracket_dot, guardar_bracket_png } = require('./reporters/graphviz');

const app = express();
const PORT = process.env.PORT || 3000;

//Middlewares etaticos y upload del file
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(fileUpload());

//diectorios de salida
const OUT_DIR = path.join(process.cwd(), 'out');
if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true});

//Punto final de subida y analisis
app.post('/analizar', async (req, res) => {
  try {
    if (!req.files || !req.files.archivo) {
      return res.status(400).send('Sube un archivo .txt con el modelo del torneo');
    }

    const archivo = req.files.archivo; // input name="archivo"
    const texto = archivo.data.toString('utf8');

    // LEXER
    const lx = new lexer(texto);
    const { tokens, errores: erroresLex } = lx.analizar();

    // PARSER
    const modelo = parsear_modelo(tokens);

    //  Unir errores
    const errores = (modelo.errores_semanticos && modelo.errores_semanticos.length)
      ? erroresLex.concat(modelo.errores_semanticos)
      : erroresLex;

    //  Generar reportes
    guardar_tokens_html(tokens, OUT_DIR);
    guardar_errores_html(errores, OUT_DIR);
    guardar_resumen_html(modelo, OUT_DIR);
    guardar_bracket_dot(modelo, OUT_DIR);


    // generar el PNG en Graphviz 
    guardar_bracket_png(OUT_DIR, (err) => {
    if (err) {
        console.warn('Graphviz (dot) no disponible, no se genero bracket.png');
    } else {
        console.log(' Bracket PNG generado en out/bracket.png');
    }
    });



    // Responder con links
    res.json({
      ok: true,
      files: {
        tokens: '/out/tokens.html',
        errores: '/out/errores.html',
        resumen: '/out/resumen.html',
        bracket: '/out/bracket.dot'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error procesando el archivo.');
  }
});

// Exponer /out/ para ver los reportes en el navegador
app.use('/out', express.static(OUT_DIR));

app.listen(PORT, () => {
    console.log(` Server listo en http://localhost:${PORT}`);
});