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
  /* Vuelve a la pantalla de búsqueda. Desde V GMM 0022 los controles viven en un
     modal, así que "estar en la búsqueda" incluye tenerlo abierto: se reabre en
     el método que estuviera activo, porque es donde están los campos. */
  async function aBuscar() {
    if (await pagina.locator("#barraVolver:not(.oculto)").count() > 0) {
      await pagina.click("#btnVolver");
      await pagina.waitForTimeout(200);
    }
    if (await pagina.locator("#capaFormulario:not(.oculto)").count() > 0) return;
    const activo = pagina.locator("#metodos .metodo.activa");
    if (await activo.count() === 0) return;   // al arrancar no hay método elegido
    await activo.click();
    await pagina.waitForTimeout(250);
  }
  /* Desde V GMM 0021 la app arranca SIN método, y desde la 0022 pulsar uno abre
     su formulario en el modal. El clic vacía la entrada y repinta la bienvenida,
     así que solo se pulsa cuando el panel del método no está ya a la vista. */
  async function abrirMetodo(cual) {
    const panel = cual === "descubrir" ? "#descubrir" : "#panelBuscar";
    if (await pagina.locator(panel).isVisible()) return;
    /* Con el modal abierto, los dos botones del inicio quedan detrás del velo:
       de método a método se pasa por el enlace del propio modal. */
    if (await pagina.locator("#capaFormulario:not(.oculto)").count() > 0) {
      await pagina.click("#btnCambiarMetodo");
    } else {
      await pagina.click('#metodos [data-metodo="' + cual + '"]');
    }
    await pagina.waitForTimeout(250);
  }
  /* El interruptor peli/serie vive en la barra, detrás del velo del modal: para
     pulsarlo hay que cerrarlo primero. */
  async function cerrarFormulario() {
    if (await pagina.locator("#capaFormulario:not(.oculto)").count() === 0) return;
    await pagina.click("#capaFormulario .modal-cerrar");
    await pagina.waitForTimeout(250);
  }
  async function buscarTitulo(txt) {
    await aBuscar();
    await abrirMetodo("buscar");
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
  /* El inicio es lo primero que se ve: conviene tener su foto a mano. */
  await pagina.waitForTimeout(1200);   // que baje el carrusel
  await pagina.screenshot({ path: path.join(CAPTURAS, "00-inicio.png"), fullPage: true });
  /* Los dos métodos han de medir EXACTAMENTE lo mismo: era parte del desorden. */
  const anchosMetodo = await pagina.evaluate(() =>
    Array.from(document.querySelectorAll("#metodos .metodo"))
      .map((b) => Math.round(b.getBoundingClientRect().width)));
  m.afirmar("los dos botones de método miden lo mismo",
    new Set(anchosMetodo).size === 1, anchosMetodo.join(" / "));

  /* ---------------------------------------------------------------- */
  m.titulo("El formulario vive en un modal (V GMM 0022)");
  m.afirmar("ningún método viene activo", (await pagina.locator("#metodos .metodo.activa").count()) === 0);
  m.afirmar("el modal del formulario nace cerrado",
    (await pagina.getAttribute("#capaFormulario", "class")).includes("oculto"));
  m.afirmar("los controles de buscar nacen ocultos", !(await pagina.locator("#panelBuscar").isVisible()));
  m.afirmar("los de descubrir nacen ocultos", !(await pagina.locator("#descubrir").isVisible()));
  m.afirmar("los filtros comunes nacen ocultos", !(await pagina.locator("#filtros").isVisible()));
  m.afirmar("el desplegable de orden no está en el inicio",
    !(await pagina.locator("#ordenMenu").isVisible()));

  await abrirMetodo("buscar");
  m.afirmar("pulsar «Buscar una en concreto» abre el modal con sus controles",
    !(await pagina.getAttribute("#capaFormulario", "class")).includes("oculto") &&
    (await pagina.locator("#panelBuscar").isVisible()) &&
    (await pagina.locator("#filtros").isVisible()));
  m.afirmar("el título del modal nombra el tipo que se busca",
    (await pagina.textContent("#tituloFormulario")).includes("película"));
  m.afirmar("el pie lleva el botón Buscar centrado",
    (await pagina.locator("#capaFormulario .modal-pie.centrado #btnBuscar").count()) === 1);
  await pagina.screenshot({ path: path.join(CAPTURAS, "08-modal-buscar.png"), fullPage: true });

  /* La X cierra, y volver a pulsar el método lo reabre. */
  await cerrarFormulario();
  m.afirmar("la X cierra el modal",
    (await pagina.getAttribute("#capaFormulario", "class")).includes("oculto"));
  await abrirMetodo("buscar");

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
  /* Acotado a #resultados a propósito: desde la 0017 el carrusel del inicio
     pinta sus sugerencias con la misma clase .tarjeta y sigue en el DOM
     (solo oculto) en las demás vistas, así que sin acotar contaría de más. */
  m.afirmar("hay 2 tarjetas", (await pagina.locator("#resultados .tarjeta").count()) === 2);

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
  /* Desde la 0020 el método NO se restaura de prefs, y desde la 0021 se
     arranca sin ninguno: al recargar los controles vuelven a estar plegados. */
  m.afirmar("el método no se restaura: vuelve plegado",
    (await pagina.locator("#metodos .metodo.activa").count()) === 0 &&
    !(await pagina.locator("#panelBuscar").isVisible()));

  /* ---------------------------------------------------------------- */
  m.titulo("Modo actor");
  await abrirMetodo("buscar");
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
  /* El interruptor vive en la barra, detrás del velo del modal: hay que
     cerrarlo para llegar a él. Es deliberado que siga ahí y no dentro. */
  await cerrarFormulario();
  await pagina.click('#tipoSwitch [data-tipo="tv"]');
  await pagina.waitForTimeout(250);
  m.afirmar("el buscador marca tipo serie",
    (await pagina.getAttribute("#buscador", "data-tipo")) === "tv");
  m.afirmar("Series queda como opción activa",
    (await pagina.getAttribute('#tipoSwitch [data-tipo="tv"]', "class")).includes("activa"));
  m.afirmar("el ejemplo del campo cambia a series",
    (await pagina.getAttribute("#entrada", "placeholder")).includes("Breaking Bad"));

  await aBuscar();
  m.afirmar("el título del modal pasa a decir «serie»",
    (await pagina.textContent("#tituloFormulario")).includes("serie"));
  await pagina.fill("#entrada", "casa");
  await pagina.click("#btnBuscar");
  await pagina.waitForSelector(".ficha-titulo", { timeout: 5000 });
  m.afirmar("encuentra la serie por título",
    (await pagina.textContent(".ficha-titulo")).includes("La casa de papel"));

  await aBuscar();
  await abrirMetodo("descubrir");
  m.afirmar("Descubrir oculta el campo de texto",
    !(await pagina.locator("#panelBuscar").isVisible()));
  m.afirmar("el enlace del modal cambia de método sin cerrarlo",
    !(await pagina.getAttribute("#capaFormulario", "class")).includes("oculto") &&
    (await pagina.locator("#descubrir").isVisible()));
  await pagina.screenshot({ path: path.join(CAPTURAS, "09-modal-descubrir.png"), fullPage: true });
  m.afirmar("el desplegable de género ofrece las cuatro colecciones (V GMM 0024)",
    (await pagina.locator('#selGenero optgroup[label="Colecciones"] option').count()) === 4);
  await pagina.selectOption("#selGenero", "18");
  await pagina.click("#btnBuscar");
  await pagina.waitForTimeout(500);
  m.afirmar("descubre series de drama", (await pagina.locator(".rejilla .tarjeta").count()) >= 3);
  await pagina.screenshot({ path: path.join(CAPTURAS, "06-series.png"), fullPage: true });

  /* ---------------------------------------------------------------- */
  m.titulo("Orden e intervalo de años en Descubrir");
  await aBuscar();
  m.afirmar("el intervalo tiene dos extremos",
    (await pagina.locator("#selAnoDesde").count()) === 1 &&
    (await pagina.locator("#selAnoHasta").count()) === 1);
  /* Acotado a #orden: desde la 0022 los interruptores están en dos sitios —el
     formulario y el desplegable de la barra—, y sin acotar se contarían dobles. */
  m.afirmar("los tres interruptores de orden arrancan apagados",
    (await pagina.locator("#orden .orden-op.activa").count()) === 0);

  await pagina.click("#ordenReciente");
  await pagina.waitForTimeout(200);
  m.afirmar("«Más recientes» se enciende",
    (await pagina.getAttribute("#ordenReciente", "class")).includes("activa"));

  await pagina.click("#ordenAntigua");
  await pagina.waitForTimeout(200);
  m.afirmar("«Más antiguas» apaga a «Más recientes»: se excluyen",
    (await pagina.getAttribute("#ordenAntigua", "class")).includes("activa") &&
    !(await pagina.getAttribute("#ordenReciente", "class")).includes("activa"));

  await pagina.click("#ordenNota");
  await pagina.waitForTimeout(200);
  m.afirmar("«Mayor puntuación» se suma en vez de sustituir",
    (await pagina.locator("#orden .orden-op.activa").count()) === 2);

  await pagina.click("#ordenAntigua");
  await pagina.waitForTimeout(200);
  m.afirmar("volver a pulsar el que está activo lo apaga",
    (await pagina.locator("#orden .orden-op.activa").count()) === 1);
  await pagina.screenshot({ path: path.join(CAPTURAS, "07-descubrir-orden.png"), fullPage: true });

  /* Con año y nota a la vez la lista se arma año por año, y el paginador pasa
     a decir en qué año estás, porque el total global no existe. */
  await pagina.click("#ordenReciente");
  await pagina.waitForTimeout(200);
  await pagina.click("#btnBuscar");
  await pagina.waitForTimeout(900);
  const infoAnio = (await pagina.textContent(".paginador-info")).trim();
  m.afirmar("el paginador nombra el año en curso", /^\d{4} · página \d+ de \d+$/.test(infoAnio), infoAnio);
  m.afirmar("el subtítulo explica cómo está ordenado",
    (await pagina.textContent(".seccion-tit small")).includes("año a año"));

  await pagina.click('.paginador [data-ir-pagina="2"] >> nth=0');
  await pagina.waitForTimeout(900);
  const infoAnio2 = (await pagina.textContent(".paginador-info")).trim();
  m.afirmar("Siguiente salta al año anterior que tenga resultados",
    /^\d{4} · página/.test(infoAnio2) && Number(infoAnio2.slice(0, 4)) < Number(infoAnio.slice(0, 4)),
    infoAnio + " → " + infoAnio2);

  await aBuscar();
  await pagina.selectOption("#selAnoDesde", "2021");
  await pagina.waitForTimeout(500);
  await pagina.selectOption("#selAnoHasta", "2015");
  await pagina.waitForTimeout(700);
  m.afirmar("un intervalo del revés se endereza solo",
    (await pagina.inputValue("#selAnoDesde")) === "2015" &&
    (await pagina.inputValue("#selAnoHasta")) === "2021");

  await pagina.click("#btnBuscar");
  await pagina.waitForSelector(".seccion-tit", { timeout: 5000 });
  await pagina.waitForTimeout(400);
  m.afirmar("el título dice el intervalo",
    (await pagina.textContent(".seccion-tit")).includes("de 2015 a 2021"));

  /* Se dejan los interruptores como estaban, que lo que sigue no los espera. */
  await aBuscar();
  await pagina.click("#ordenReciente");
  await pagina.click("#ordenNota");
  await pagina.selectOption("#selAnoDesde", "");
  await pagina.selectOption("#selAnoHasta", "");
  await pagina.waitForTimeout(400);
  m.afirmar("se puede volver al orden por popularidad",
    (await pagina.locator("#orden .orden-op.activa").count()) === 0);

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
  /* Cinco carruseles a la vez, uno por categoría. El modal que elegía cuál se
     veía ya no existe: con los cinco delante no elegía nada. */
  m.titulo("Cinco carruseles, uno por categoría (V GMM 0023)");
  await cerrarFormulario();
  if (await pagina.locator("#barraVolver:not(.oculto)").count() > 0) {
    await pagina.click("#btnVolver");
    await pagina.waitForTimeout(900);
  }
  m.afirmar("hay cinco bloques de carrusel",
    (await pagina.locator("#descubrimiento .carrusel-bloque").count()) === 5);
  m.afirmar("cada bloque tiene su propia pista",
    (await pagina.locator("#descubrimiento .carrusel").count()) === 5);
  const clavesPista = await pagina.evaluate(() =>
    Array.from(document.querySelectorAll("#descubrimiento .carrusel")).map((c) => c.id));
  m.afirmar("las pistas llevan el id de su categoría",
    clavesPista.join(",") === "carrusel-tendencia,carrusel-siempre,carrusel-tarde,carrusel-clasicos,carrusel-favoritas",
    clavesPista.join(","));
  m.afirmar("los cinco títulos vienen del config",
    (await pagina.evaluate(() =>
      Array.from(document.querySelectorAll(".carrusel-tit")).map((t) => t.textContent).join("|"))) ===
      "Tendencia|Las 20 de siempre|Nunca es tarde|Clásicos|Lo que prefieres");
  m.afirmar("«Ver más» solo en las tres con intervalo de años",
    (await pagina.locator("#descubrimiento [data-vermas]").count()) === 3);
  m.afirmar("ya no existe el botón «Dame sugerencias»",
    (await pagina.locator("#btnSugerencias").count()) === 0);
  m.afirmar("ni su modal", (await pagina.locator("#capaSugerencias").count()) === 0);
  /* La insignia de nota es de TMDB, no de IMDb: es la misma que ordena la lista. */
  m.afirmar("las tarjetas del carrusel llevan la nota de TMDB",
    (await pagina.locator("#carrusel-tendencia .tarjeta-nota").count()) > 0);
  m.afirmar("no queda la insignia de IMDb",
    (await pagina.locator("#descubrimiento .tarjeta-imdb").count()) === 0);
  m.afirmar("la nota se lee como un número con un decimal",
    /^★ \d+\.\d$/.test((await pagina.textContent("#carrusel-tendencia .tarjeta-nota")).trim()),
    await pagina.textContent("#carrusel-tendencia .tarjeta-nota"));
  await pagina.screenshot({ path: path.join(CAPTURAS, "11-carruseles.png"), fullPage: true });

  /* El tope son 20 por carrusel, y el catálogo de ejemplo solo tiene ocho: hay
     que inyectar una respuesta de treinta para ver si corta.

     Va en una pestaña aparte porque los carruseles se cachean por "tipo:clave"
     y a estas alturas de la sesión ya están todos cacheados: en la pestaña de
     siempre el doble no llegaría a pedirse. El stub se instala desde un
     addInitScript en DOMContentLoaded, que corre ANTES que GMM.app.iniciar
     —se registra primero— y con GMM ya definido. */
  const paginaTope = await contexto.newPage();
  await paginaTope.addInitScript(() => {
    window.__GMM_FORZAR_DEMO = true;
    document.addEventListener("DOMContentLoaded", () => {
      const base = GMM.demo.PELICULAS, items = [];
      for (let i = 0; i < 30; i++) items.push(Object.assign({}, base[i % base.length], { id: 900000 + i }));
      GMM.tmdb.tendencia = () => Promise.resolve(items);
    });
  });
  await paginaTope.goto(PAGINA);
  await paginaTope.waitForTimeout(900);
  const cuantas = await paginaTope.locator("#carrusel-tendencia .tarjeta").count();
  m.afirmar("cada carrusel corta en 20 títulos", cuantas === 20, String(cuantas));
  await paginaTope.close();

  /* ---------------------------------------------------------------- */
  /* "Ver más" pagina de corrido: 20 por página y «Página X de N». Antes decía
     «2000 · 10 mejores» porque encendía año + nota a la vez, y esa combinación
     obliga al recorrido año por año. */
  m.titulo("«Ver más» pagina de corrido, no por años");
  await pagina.evaluate(() => {
    const base = GMM.demo.PELICULAS, items = [];
    for (let i = 0; i < 20; i++) items.push(Object.assign({}, base[i % base.length], { id: 800000 + i }));
    GMM.tmdb.descubrir = (tipo, opciones, p) => Promise.resolve({ items, pagina: p || 1, total: 30 });
  });
  await pagina.click('[data-vermas="siempre"]');
  await pagina.waitForTimeout(700);
  const infoVerMas = (await pagina.textContent(".paginador-info")).trim();
  m.afirmar("el paginador dice «Página 1 de 30»", infoVerMas === "Página 1 de 30", infoVerMas);
  m.afirmar("no queda rastro de la etiqueta por año", !/^\d{4} ·/.test(infoVerMas), infoVerMas);
  m.afirmar("muestra 20 carátulas", (await pagina.locator(".rejilla .tarjeta").count()) === 20);
  await pagina.click('.paginador [data-ir-pagina="2"] >> nth=0');
  await pagina.waitForTimeout(500);
  m.afirmar("Siguiente va a la página 2 de 30",
    (await pagina.textContent(".paginador-info")).trim() === "Página 2 de 30");

  /* El desplegable de orden, junto a la flecha y en su misma fila. */
  m.titulo("Desplegable de orden junto a la flecha ←");
  m.afirmar("acompaña a la flecha", await pagina.locator("#ordenMenu").isVisible());
  m.afirmar("comparte fila con la flecha", await pagina.evaluate(() => {
    const f = document.querySelector("#btnVolver").getBoundingClientRect();
    const o = document.querySelector("#ordenMenu").getBoundingClientRect();
    return Math.abs((f.top + f.height / 2) - (o.top + o.height / 2)) < 12;
  }));
  m.afirmar("el panel arranca cerrado", !(await pagina.locator("#ordenPanel").isVisible()));
  await pagina.click("#btnOrdenMenu");
  await pagina.waitForTimeout(250);
  m.afirmar("se abre con los tres interruptores",
    (await pagina.locator("#ordenPanel .orden-op").count()) === 3);
  await pagina.screenshot({ path: path.join(CAPTURAS, "12-orden-menu.png"), fullPage: true });
  /* Las dos copias de los interruptores han de decir lo mismo. */
  await pagina.click('#ordenPanel [data-orden="nota"]');
  await pagina.waitForTimeout(600);
  m.afirmar("encender uno aquí también lo enciende en el formulario",
    (await pagina.getAttribute("#ordenNota", "class")).includes("activa"));
  m.afirmar("y reordena sin volver atrás",
    (await pagina.locator(".rejilla .tarjeta").count()) === 20);
  await pagina.click('#ordenPanel [data-orden="nota"]');   // se deja como estaba
  await pagina.waitForTimeout(500);

  /* ---------------------------------------------------------------- */
  m.titulo("Móvil, 375 px");
  await pagina.setViewportSize({ width: 375, height: 780 });
  await aBuscar();
  await cerrarFormulario();
  await pagina.click('#tipoSwitch [data-tipo="movie"]');
  await aBuscar();
  await abrirMetodo("buscar");
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

  /* El modal-formulario es lo que más se estrecha: hay que verlo también aquí,
     con sus campos en una sola columna y sin comerse la pantalla entera. */
  await aBuscar();
  await abrirMetodo("descubrir");
  await pagina.waitForTimeout(300);
  const desbordeDescubrir = await pagina.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  m.afirmar("Descubrir tampoco desborda en el móvil", desbordeDescubrir <= 0,
    "sobran " + desbordeDescubrir + " px");
  /* No debe ocupar el 100%: el velo tiene que verse alrededor. */
  const holgura = await pagina.evaluate(() => {
    const caja = document.querySelector("#capaFormulario .modal").getBoundingClientRect();
    return { izq: Math.round(caja.left), alto: Math.round(caja.height), pantalla: window.innerHeight };
  });
  m.afirmar("el modal deja margen a los lados en el móvil", holgura.izq >= 8, JSON.stringify(holgura));
  m.afirmar("y no ocupa toda la altura de la pantalla",
    holgura.alto < holgura.pantalla, JSON.stringify(holgura));
  await pagina.screenshot({ path: path.join(CAPTURAS, "10-descubrir-movil.png"), fullPage: true });

  /* ---------------------------------------------------------------- */
  m.titulo("Errores acumulados en toda la sesión");
  m.afirmar("ninguno", errores.length === 0, errores.slice(0, 4).join(" | "));

  await navegador.close();
  m.nota("capturas en pruebas/capturas/");
  process.exit(m.resumir() ? 1 : 0);
})().catch((e) => { console.error("REVENTÓ:", e); process.exit(1); });
