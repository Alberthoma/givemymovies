/* ══════════════════════════════════════════════════════════════════════
   cargar.js — utilidad compartida por las pruebas

   Extrae el bloque <script> de index.html y lo ejecuta en Node con un
   navegador simulado mínimo, devolviendo el objeto global GMM.

   Ojo: se usa vm.runInThisContext y NO eval. El "use strict" del inicio
   del script hace que eval cree su propio ámbito, y las variables `var`
   nunca llegarían al global — GMM saldría undefined.
   ══════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const INDICE = path.join(RAIZ, "index.html");

/** Devuelve el JavaScript embebido en index.html, como texto. */
function extraerJs() {
  const html = fs.readFileSync(INDICE, "utf8");
  const inicio = html.indexOf("<script>");
  const fin = html.lastIndexOf("</script>");
  if (inicio === -1 || fin === -1) {
    throw new Error("No se encontró el bloque <script> en index.html");
  }
  return html.substring(inicio + "<script>".length, fin);
}

/** Simula lo mínimo del navegador y carga el script. Devuelve GMM. */
function cargarGmm() {
  const almacen = {};
  global.localStorage = {
    getItem: (k) => (k in almacen ? almacen[k] : null),
    setItem: (k, v) => { almacen[k] = String(v); },
    removeItem: (k) => { delete almacen[k]; }
  };
  global.document = { addEventListener() {} };
  global.window = { console };
  if (!global.fetch) {
    global.fetch = () => Promise.reject(new Error("sin red en las pruebas"));
  }

  vm.runInThisContext(extraerJs(), { filename: "index.html <script>" });
  global.__almacen = almacen;
  return global.GMM;
}

/* ---- marcador de pruebas sencillo, sin dependencias ---- */
function crearMarcador() {
  let fallos = 0, total = 0;
  return {
    afirmar(nombre, condicion, extra) {
      total++;
      if (condicion) console.log("  ok   " + nombre);
      else { fallos++; console.log("  FALLA " + nombre + (extra ? "  ->  " + extra : "")); }
    },
    titulo(texto) { console.log("\n== " + texto + " =="); },
    nota(texto) { console.log("  " + texto); },
    resumir() {
      console.log("\n" + (fallos
        ? "  " + fallos + " FALLOS de " + total
        : "  " + total + " comprobaciones, todas correctas"));
      return fallos;
    }
  };
}

module.exports = { RAIZ, INDICE, extraerJs, cargarGmm, crearMarcador };
