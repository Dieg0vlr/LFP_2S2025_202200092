import { lexer } from '../src/lexer.js';
import { parsear_modelo } from '../src/parser.js';
import { tokens_html, errores_html, resumen_html, bracket_dot } from '../src/reporters/html_strings.js';

const $ = sel => document.querySelector(sel);
const fileInput = $('#fileInput');
const btn = $('#analyzeBtn');
const s = $('#status');

const aTok = $('#dlTokens');
const aErr = $('#dlErrores');
const aRes = $('#dlResumen');
const aDot = $('#dlDot');

const pvTok = $('#pvTokens');
const pvErr = $('#pvErrores');
const pvRes = $('#pvResumen');
const pvDot = $('#pvDot');

function blobUrl(text, type='text/html'){
  return URL.createObjectURL(new Blob([text], {type}));
}

btn.addEventListener('click', async () => {
  try{
    if(!fileInput.files || !fileInput.files[0]){
      s.textContent = 'Selecciona un .txt primero';
      return;
    }
    s.textContent = 'Analizando...';

    const text = await fileInput.files[0].text();

    // LEXER
    const lx = new lexer(text);
    const { tokens, errores: erroresLex } = lx.analizar();

    // PARSER
    const modelo = parsear_modelo(tokens);
    const errores = (modelo.errores_semanticos && modelo.errores_semanticos.length)
      ? erroresLex.concat(modelo.errores_semanticos)
      : erroresLex;

    // HTMLs y DOT
    const htmlTok = tokens_html(tokens);
    const htmlErr = errores_html(errores);
    const htmlRes = resumen_html(modelo);
    const dot = bracket_dot(modelo);

    // Descargas
    aTok.href = blobUrl(htmlTok); aTok.classList.remove('hidden');
    aErr.href = blobUrl(htmlErr); aErr.classList.remove('hidden');
    aRes.href = blobUrl(htmlRes); aRes.classList.remove('hidden');
    aDot.href = blobUrl(dot, 'text/plain'); aDot.classList.remove('hidden');

    // Vistas rapidas
    pvTok.src = aTok.href;
    pvErr.src = aErr.href;
    pvRes.src = aRes.href;
    pvDot.textContent = dot;

    s.textContent = 'Listo';
  }catch(err){
    console.error(err);
    s.textContent = 'Error analizando el archivo (ver consola).';
  }
});
