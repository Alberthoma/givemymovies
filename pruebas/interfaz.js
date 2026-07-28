/* ══════════════════════════════════════════════════════════════════════
   interfaz.js — recorre la app real en Chromium y comprueba que funciona

   Ejecutar:  node pruebas/interfaz.js
   Requiere:  npm install playwright-core   (dentro de pruebas/)

   Es la ÚNICA parte del proyecto con dependencia externa, y es opcional:
   la aplicación en sí no necesita npm ni nada instalado. Si falta
   playwright-core, este script lo dice y sale sin marcar fallo.
   ══════════════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");
const { RAIZ, INDICE, crearMarcador } = require("./cargar");

let chromium;
try {
  chromium = require("playwright-core").chromium;
} catch (e) {
  console.log("\n  playwright-core no está instalado.");
  console.log("  Para ejecutar estas comprobaciones:\n");
  console.log("      cd pruebas");
  console.log("      npm install playwright-core\n");
  console.log("  Las pruebas de lógica (node pruebas/logica.js) no lo necesitan.");
  process.exit(0);
}

/** Busca un Chromium ya descargado en la caché de Playwright. */
function buscarChromium() {
  const base = path.join(process.env.LOCALAPPDATA || process.env.HOME || "", "ms-playwright");
  if (!fs.existsSync(base)) return null;
  const candidatos = fs.readdirSync(base)
    .filter((n) => n.startsWith("chromium-"))
    .sort()
    .reverse();
  for (const c of candidatos) {
    for (const rel of ["chrome-win64/chrome.exe", "chrome-win/chrome.exe",
                       "chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
      const ruta = path.join(base, c, rel);
      if (fs.existsSync(ruta)) return ruta;
    }
  }
  return null;
}

const EXE = buscarChromium();
if (!EXE) {
  console.log("\n  No se encontró ningún Chromium descargado.");
  console.log("  Instálalo con:  npx playwright install chromium\n");
  process.exit(0);
}

const PAGINA = "file:///" + INDICE.replace(/\\/g, "/").replace(/ /g, "%20").replace(/\$/g, "%24");
const CAPTURAS = path.join(RAIZ, "pruebas", "capturas");

(async () => {
  const m = crearMarcador();
  if (!fs.existsSync(CAPTURAS)) fs.mkdirSync(CAPTURAS, { recursive: true });

  const navegador = await chromium.launch({ executablePath: EXE });
  const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pagina = await contexto.newPage();

  /* Estas comprobaciones esperan el catálogo de demo, que es estable.
     Si existe PRIVADO/clave-local.js, la app arrancaría en vivo y los
     números cambiarían cada día; la bandera le dice que no cargue. */
  await pagina.addInitScript(() => { window.__GMM_FORZAR_DEMO = true; });

  const errores = [];
  pagina.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  pagina.on("console", (c) => {
    if (c.type() !== "error") return;
    /* Que falte PRIVADO/clave-local.js es lo normal en un clon del
       repositorio: la app cae a modo demo y no se rompe nada. */
    if (/clave-local\.js/.test(c.text())) return;
    errores.push("console: " + c.text());
  });

  await pagina.goto(PAGINA);
  await pagina.waitForTimeout(600);

  /* Desde V GMM 0009 los resultados ocultan el formulario y aparece una flecha
     ← para volver. Estos ayudantes reflejan ese flujo: los filtros se eligen
     en la pantalla de búsqueda, no sobre el resultado. */
  async function aBuscar() {
    if (await pagina.locator("#barraVolver:not(.oculto)").count() > 0) {
      await pagina.click("#btnVolver");
      await pagina.waitForTimeout(200);
    }
  }
  async function buscarTitulo(txt) {
    await aBuscar();
    await pagina.fill("#entrada", txt);
    await pagina.click("#btnBuscar");
    await pagina.waitForTimeout(400);
  }

  /* ---------------------------------------------------------------- */
  m.titulo("Arranque");
  m.afirmar("sin errores de JavaScript", errores.length === 0, errores.join(" | "));
  m.afirmar("la marca se pinta", (await pagina.textContent(".marca-texto")).includes("givemymovies"));
  m.afirmar("arranca en modo demo (punto naranja)",
    (await pagina.getAttribute("#pastillaModo", "title")) === "Modo demo");
  m.afirmar("el selector de idioma tiene 13 opciones",
    (await pagina.locator("#selIdioma option").count()) === 13);
  m.afirmar("el selector de país tiene 6 grupos",
    (await pagina.locator("#selPais optgroup").count()) === 6);
  m.afirmar("el selector de plataformas se rellenó",
    (await pagina.locator("#selPlataforma option").count()) > 5);
  m.afirmar("idioma por defecto: español", (await pagina.inputValue("#selIdioma")) === "es");
  m.afirmar("se ve la pantalla de bienvenida",
    (await pagina.textContent("#resultados")).includes("Empieza por buscar"));
  m.afirmar("el pie muestra la versión",
    /^V GMM \d{4}$/.test((await pagina.textContent("#version-app")).trim()),
    await pagina.textContent("#version-app"));

  /* ---------------------------------------------------------------- */
  m.titulo("Autocompletado");
  await pagina.fill("#entrada", "inter");
  await pagina.waitForTimeout(700);
  m.afirmar("sugiere al escribir", (await pagina.locator(".sugerencia").count()) >= 1);
  m.afirmar("la sugerencia es Interestelar",
    (await pagina.locator(".sugerencia-tit").first().textContent()).includes("Interestelar"));

  /* ---------------------------------------------------------------- */
  m.titulo("Buscar Interestelar en español");
  await pagina.click(".sugerencia >> nth=0");
  await pagina.waitForSelector(".ficha-titulo", { timeout: 5000 });

  m.afirmar("título correcto", (await pagina.textContent(".ficha-titulo")).trim() === "Interestelar");
  const resumen = (await pagina.textContent(".resumen-txt")).replace(/\s+/g, " ").trim();
  m.nota("frase: " + resumen);
  m.afirmar("la frase menciona el idioma", resumen.includes("en español"));
  m.afirmar("aparece el aviso de estimación", (await pagina.locator(".nota-idioma").count()) === 1);
  m.afirmar("pinta 6 países", (await pagina.locator(".pais").count()) === 6);
  m.afirmar("hay botón para ver los ocultos", (await pagina.locator("#btnMostrarTodos").count()) === 1);
  m.afirmar("hay sellos de confianza", (await pagina.locator(".sello").count()) === 6);

  await pagina.waitForTimeout(2500);   // margen para que bajen las imágenes
  const poster = await pagina.evaluate(() => {
    const img = document.querySelector(".ficha-poster img");
    return img ? { hay: true, ancho: img.naturalWidth } : { hay: false };
  });
  m.afirmar("la carátula se descarga de verdad", poster.hay && poster.ancho > 0, JSON.stringify(poster));
  await pagina.screenshot({ path: path.join(CAPTURAS, "01-pelicula.png"), fullPage: true });

  /* ---------------------------------------------------------------- */
  m.titulo("Ver todos los países");
  await pagina.click("#btnMostrarTodos");
  await pagina.waitForTimeout(300);
  m.afirmar("ahora se ven los 10", (await pagina.locator(".pais").count()) === 10);
  await pagina.click("#btnSoloIdioma");
  await pagina.waitForTimeout(300);
  m.afirmar("vuelve a 6", (await pagina.locator(".pais").count()) === 6);

  /* ---------------------------------------------------------------- */
  m.titulo("Filtrar por plataforma (se elige antes de buscar)");
  await aBuscar();
  await pagina.selectOption("#selPlataforma", "Netflix");
  await buscarTitulo("Interestelar");
  await pagina.waitForSelector(".ficha-titulo", { timeout: 5000 });
  m.afirmar("con Netflix se reduce a 3 países", (await pagina.locator(".pais").count()) === 3);
  m.afirmar("la frase refleja el filtro", (await pagina.textContent(".resumen-txt")).includes("Netflix"));
  await aBuscar();
  await pagina.selectOption("#selPlataforma", "");

  /* ---------------------------------------------------------------- */
  m.titulo("Idioma japonés: Japón SÍ debe salir");
  await pagina.selectOption("#selIdioma", "ja");
  await buscarTitulo("Interestelar");
  await pagina.waitForSelector(".ficha-titulo", { timeout: 5000 });
  m.afirmar("solo queda Japón", (await pagina.locator(".pais").count()) === 1);
  m.afirmar("y es Japón", (await pagina.textContent(".pais-nombre")).includes("Japón"));

  m.titulo("Idioma árabe: ningún mercado lo sirve");
  await aBuscar();
  await pagina.selectOption("#selIdioma", "ar");
  await buscarTitulo("Interestelar");
  m.afirmar("avisa de que no hay nada en ese idioma",
    (await pagina.textContent("#resultados")).includes("ninguno cuyo catálogo se sirva en árabe"));
  m.afirmar("ofrece la salida de emergencia", (await pagina.locator("#btnMostrarTodos").count()) === 1);
  await pagina.screenshot({ path: path.join(CAPTURAS, "02-sin-idioma.png"), fullPage: true });
  await aBuscar();
  await pagina.selectOption("#selIdioma", "es");

  /* ---------------------------------------------------------------- */
  m.titulo("Listas");
  m.afirmar("contador a 0", (await pagina.textContent("#contadorListas")).trim() === "0");
  await buscarTitulo("Interestelar");
  await pagina.waitForSelector(".ficha-acciones .boton-lista.fav", { timeout: 5000 });
  m.afirmar("pinta 6 países en español", (await pagina.locator(".pais").count()) === 6);
  await pagina.click(".ficha-acciones .boton-lista.fav");
  await pagina.waitForTimeout(250);
  m.afirmar("contador a 1", (await pagina.textContent("#contadorListas")).trim() === "1");
  m.afirmar("el botón cambia de texto",
    (await pagina.textContent(".ficha-acciones .boton-lista.fav")).includes("En favoritas"));
  await pagina.click(".ficha-acciones .boton-lista.pen");
  await pagina.waitForTimeout(250);
  m.afirmar("contador a 2", (await pagina.textContent("#contadorListas")).trim() === "2");

  await pagina.click("#btnListas");
  await pagina.waitForTimeout(400);
  const textoListas = await pagina.textContent("#resultados");
  m.afirmar("la vista muestra pendientes", textoListas.includes("Pendientes de ver"));
  m.afirmar("la vista muestra favoritas", textoListas.includes("Favoritas"));
  m.afirmar("hay 2 tarjetas", (await pagina.locator(".tarjeta").count()) === 2);

  m.titulo("¿Dónde puedo verlas ahora?");
  await pagina.click("#btnDondeVerPendientes");
  await pagina.waitForTimeout(900);
  m.nota(await pagina.textContent("#textoProgreso"));
  m.afirmar("informa del resultado", (await pagina.textContent("#textoProgreso")).includes("Listo"));
  m.afirmar("etiqueta las plataformas", (await pagina.locator(".mini-plataforma").count()) > 0);
  await pagina.screenshot({ path: path.join(CAPTURAS, "03-listas.png"), fullPage: true });

  /* ---------------------------------------------------------------- */
  m.titulo("Persistencia tras recargar");
  await pagina.reload();
  await pagina.waitForTimeout(600);
  m.afirmar("el contador sobrevive", (await pagina.textContent("#contadorListas")).trim() === "2");
  m.afirmar("el idioma elegido sobrevive", (await pagina.inputValue("#selIdioma")) === "es");

  /* ---------------------------------------------------------------- */
  m.titulo("Modo actor");
  await pagina.selectOption("#selBusquedaPor", "actor");
  await pagina.fill("#entrada", "Penélope");
  await pagina.waitForTimeout(700);
  await pagina.keyboard.press("Escape");
  await pagina.waitForTimeout(150);
  m.afirmar("Escape cierra las sugerencias", (await pagina.locator(".sugerencia").count()) === 0);
  await pagina.click("#btnBuscar");
  await pagina.waitForSelector(".persona-nombre", { timeout: 5000 });
  m.afirmar("ficha de la actriz", (await pagina.textContent(".persona-nombre")).includes("Penélope"));
  m.afirmar("hay filmografía", (await pagina.locator("#rejillaFilmografia .tarjeta").count()) >= 1);
  await pagina.click("#btnDondeVerTodas");
  await pagina.waitForTimeout(900);
  m.afirmar("consulta la disponibilidad de sus pelis",
    (await pagina.textContent("#textoProgreso")).includes("Listo"));
  await pagina.screenshot({ path: path.join(CAPTURAS, "04-actor.png"), fullPage: true });

  /* ---------------------------------------------------------------- */
  m.titulo("Modal de detalle");
  await pagina.click("#rejillaFilmografia .tarjeta-img >> nth=0");
  await pagina.waitForTimeout(800);
  m.afirmar("el modal se abre",
    !(await pagina.locator("#capaDetalle").getAttribute("class")).includes("oculto"));
  m.afirmar("el modal trae países", (await pagina.locator("#capaDetalle .pais").count()) > 0);
  await pagina.keyboard.press("Escape");
  await pagina.waitForTimeout(300);
  m.afirmar("Escape lo cierra",
    (await pagina.locator("#capaDetalle").getAttribute("class")).includes("oculto"));

  /* ---------------------------------------------------------------- */
  m.titulo("Modo trama");
  await aBuscar();
  await pagina.selectOption("#selBusquedaPor", "trama");
  await pagina.fill("#entrada", "viajes en el tiempo");
  await pagina.click("#btnBuscar");
  await pagina.waitForTimeout(800);
  m.afirmar("devuelve una cuadrícula", (await pagina.locator(".rejilla .tarjeta").count()) === 2);

  /* ---------------------------------------------------------------- */
  m.titulo("Interruptor Película / Serie");
  await aBuscar();
  await pagina.selectOption("#selBusquedaPor", "titulo");
  await pagina.click('#tipoSwitch [data-tipo="tv"]');
  await pagina.waitForTimeout(250);
  m.afirmar("el buscador marca tipo serie",
    (await pagina.getAttribute("#buscador", "data-tipo")) === "tv");
  m.afirmar("Series queda como opción activa",
    (await pagina.getAttribute('#tipoSwitch [data-tipo="tv"]', "class")).includes("activa"));
  m.afirmar("el ejemplo del campo cambia a series",
    (await pagina.getAttribute("#entrada", "placeholder")).includes("Breaking Bad"));

  await pagina.fill("#entrada", "casa");
  await pagina.click("#btnBuscar");
  await pagina.waitForSelector(".ficha-titulo", { timeout: 5000 });
  m.afirmar("encuentra la serie por título",
    (await pagina.textContent(".ficha-titulo")).includes("La casa de papel"));

  await aBuscar();
  await pagina.click('#metodos [data-metodo="descubrir"]');
  await pagina.waitForTimeout(200);
  m.afirmar("Descubrir oculta el campo de texto",
    !(await pagina.locator("#panelBuscar").isVisible()));
  await pagina.selectOption("#selGenero", "18");
  await pagina.click("#btnBuscar");
  await pagina.waitForTimeout(500);
  m.afirmar("descubre series de drama", (await pagina.locator(".rejilla .tarjeta").count()) >= 3);
  await pagina.screenshot({ path: path.join(CAPTURAS, "06-series.png"), fullPage: true });

  /* ---------------------------------------------------------------- */
  m.titulo("Paginador de Descubrir");
  /* En demo hay una sola página, así que inyectamos una respuesta con varias
     para comprobar los controles y el paso de página, sin depender de red. */
  await aBuscar();
  await pagina.evaluate(() => {
    const base = GMM.demo.SERIES, items = [];
    for (let i = 0; i < 20; i++) items.push(Object.assign({}, base[i % base.length], { id: 900000 + i }));
    GMM.tmdb.descubrir = (tipo, opciones, p) => Promise.resolve({ items, pagina: p || 1, total: 7 });
  });
  await pagina.click("#btnBuscar");
  await pagina.waitForTimeout(300);
  m.afirmar("aparece el paginador", (await pagina.locator(".paginador").count()) >= 1);
  m.afirmar("muestra «Página 1 de 7»", (await pagina.textContent(".paginador-info")).includes("1 de 7"));
  await pagina.click('.paginador [data-ir-pagina="2"] >> nth=0');
  await pagina.waitForTimeout(300);
  m.afirmar("Siguiente avanza a la página 2", (await pagina.textContent(".paginador-info")).includes("2 de 7"));

  /* ---------------------------------------------------------------- */
  m.titulo("Móvil, 375 px");
  await pagina.setViewportSize({ width: 375, height: 780 });
  await aBuscar();
  await pagina.click('#metodos [data-metodo="buscar"]');
  await pagina.click('#tipoSwitch [data-tipo="movie"]');
  await pagina.selectOption("#selBusquedaPor", "titulo");
  await pagina.fill("#entrada", "Coco");
  await pagina.click("#btnBuscar");
  await pagina.waitForSelector(".ficha-titulo", { timeout: 5000 });
  await pagina.waitForTimeout(900);
  m.afirmar("el desplegable no reaparece tras buscar",
    (await pagina.locator(".sugerencia").count()) === 0);
  m.afirmar("en resultados aparece la flecha de volver",
    !(await pagina.locator("#barraVolver").getAttribute("class")).includes("oculto"));
  const desborde = await pagina.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  m.afirmar("sin desbordamiento horizontal", desborde <= 0, "sobran " + desborde + " px");
  await pagina.screenshot({ path: path.join(CAPTURAS, "05-movil.png"), fullPage: true });

  /* ---------------------------------------------------------------- */
  m.titulo("Errores acumulados en toda la sesión");
  m.afirmar("ninguno", errores.length === 0, errores.slice(0, 4).join(" | "));

  await navegador.close();
  m.nota("capturas en pruebas/capturas/");
  process.exit(m.resumir() ? 1 : 0);
})().catch((e) => { console.error("REVENTÓ:", e); process.exit(1); });
