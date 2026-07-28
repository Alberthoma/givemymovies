/* ══════════════════════════════════════════════════════════════════════
   logica.js — pruebas de la lógica de givemymovies, sin navegador

   Ejecutar:  node pruebas/logica.js
   Sin dependencias: solo Node.
   ══════════════════════════════════════════════════════════════════════ */

const { cargarGmm, crearMarcador } = require("./cargar");
const GMM = cargarGmm();
const m = crearMarcador();

const inter = GMM.demo.porId(157336);
const provInter = GMM.demo.proveedoresComoTmdb(inter);

/* ---------------------------------------------------------------- */
m.titulo("Interestelar, idioma español, sin más filtros");

let r = GMM.idioma.filtrar(provInter,
  { plataforma: "", pais: "", idioma: "es", mostrarTodos: false }, inter.original_language);
let codigos = r.paises.map((p) => p.codigo).sort();
m.nota("países mostrados: " + codigos.join(", "));
m.nota("ocultos por idioma: " + r.ocultosPorIdioma + " | total con oferta: " + r.totalPaises);

m.afirmar("incluye Argentina", codigos.includes("AR"));
m.afirmar("incluye México", codigos.includes("MX"));
m.afirmar("incluye España", codigos.includes("ES"));
m.afirmar("incluye Estados Unidos (español como 2º idioma)", codigos.includes("US"));
m.afirmar("excluye Japón", !codigos.includes("JP"));
m.afirmar("excluye Alemania", !codigos.includes("DE"));
m.afirmar("excluye Brasil", !codigos.includes("BR"));
m.afirmar("cuenta 4 países ocultos (BR, FR, DE, JP)", r.ocultosPorIdioma === 4, "fueron " + r.ocultosPorIdioma);
m.afirmar("nombre de país en español", r.paises.some((p) => p.nombre === "Argentina"));
m.afirmar("AR marcado como confianza alta",
  r.paises.find((p) => p.codigo === "AR").confianza.nivel === "alto");
m.afirmar("US marcado como confianza media (español cooficial)",
  r.paises.find((p) => p.codigo === "US").confianza.nivel === "medio");

/* ---------------------------------------------------------------- */
m.titulo("La frase resumen");

let frase = GMM.idioma.frase(inter.title, r, { idioma: "es" });
m.nota(frase.html.replace(/<[^>]+>/g, ""));
m.afirmar("la frase no está vacía", !frase.vacia);
m.afirmar("menciona el idioma", frase.html.includes("en español"));
m.afirmar("menciona Netflix", frase.html.includes("Netflix"));

/* ---------------------------------------------------------------- */
m.titulo("Mismo caso, filtrando por Netflix");

r = GMM.idioma.filtrar(provInter,
  { plataforma: "Netflix", pais: "", idioma: "es", mostrarTodos: false }, "en");
codigos = r.paises.map((p) => p.codigo).sort();
m.nota("países: " + codigos.join(", "));
m.afirmar("solo los países con Netflix: AR, CL, MX", codigos.join(",") === "AR,CL,MX", codigos.join(","));
m.afirmar("Max desaparece al filtrar por Netflix",
  !r.paises.some((p) => p.grupos.some((g) => g.plataformas.some((x) => x.provider_name === "Max"))));

/* ---------------------------------------------------------------- */
m.titulo("Alias de plataforma: 'Max' debe capturar 'HBO Max'");

m.afirmar("Max coincide con HBO Max", GMM.idioma.coincidePlataforma("HBO Max", "Max"));
m.afirmar("Max coincide con Max", GMM.idioma.coincidePlataforma("Max", "Max"));
m.afirmar("Netflix no coincide con Max", !GMM.idioma.coincidePlataforma("Netflix", "Max"));
m.afirmar("sin filtro, todo coincide", GMM.idioma.coincidePlataforma("Lo que sea", ""));

/* ---------------------------------------------------------------- */
m.titulo("Idioma sin ninguna coincidencia (Interestelar en árabe)");

r = GMM.idioma.filtrar(provInter, { plataforma: "", pais: "", idioma: "ar", mostrarTodos: false }, "en");
frase = GMM.idioma.frase(inter.title, r, { idioma: "ar" });
m.nota(frase.html.replace(/<[^>]+>/g, ""));
m.afirmar("no devuelve países", r.paises.length === 0);
m.afirmar("la frase avisa de que sí está en otros países",
  frase.vacia && frase.html.includes("10"));

/* ---------------------------------------------------------------- */
m.titulo("Japón SÍ debe salir cuando se busca en japonés");

r = GMM.idioma.filtrar(provInter, { plataforma: "", pais: "", idioma: "ja", mostrarTodos: false }, "en");
m.afirmar("solo Japón", r.paises.length === 1 && r.paises[0].codigo === "JP",
  r.paises.map((p) => p.codigo).join(","));

/* ---------------------------------------------------------------- */
m.titulo("'Ver todos los países igualmente'");

r = GMM.idioma.filtrar(provInter, { plataforma: "", pais: "", idioma: "ar", mostrarTodos: true }, "en");
m.afirmar("con mostrarTodos aparecen los 10 países", r.paises.length === 10, "fueron " + r.paises.length);

/* ---------------------------------------------------------------- */
m.titulo("Filtro por país concreto");

r = GMM.idioma.filtrar(provInter, { plataforma: "", pais: "ES", idioma: "es", mostrarTodos: false }, "en");
m.afirmar("solo España", r.paises.length === 1 && r.paises[0].codigo === "ES");
m.afirmar("España trae Movistar y SkyShowtime",
  r.paises[0].grupos[0].plataformas.map((p) => p.provider_name).join(",") === "Movistar Plus+,SkyShowtime");

/* ---------------------------------------------------------------- */
m.titulo("Audio original: Parásitos en coreano");

const parasitos = GMM.demo.porId(496243);
r = GMM.idioma.filtrar(GMM.demo.proveedoresComoTmdb(parasitos),
  { plataforma: "", pais: "", idioma: "ko", mostrarTodos: false }, parasitos.original_language);
m.nota("países: " + r.paises.map((p) => p.codigo).join(", "));
m.afirmar("Corea aparece con confianza alta",
  r.paises.find((p) => p.codigo === "KR") && r.paises.find((p) => p.codigo === "KR").confianza.nivel === "alto");
m.afirmar("el resto aparece como audio original",
  r.paises.filter((p) => p.codigo !== "KR").every((p) => p.confianza.nivel === "medio"));

/* ---------------------------------------------------------------- */
m.titulo("Orden: la mayor confianza va primero");

r = GMM.idioma.filtrar(provInter, { plataforma: "", pais: "", idioma: "es", mostrarTodos: true }, "en");
const niveles = r.paises.map((p) => p.confianza.nivel);
const rango = { alto: 0, medio: 1, neutro: 2, bajo: 3 };
m.afirmar("los niveles van de mejor a peor",
  niveles.every((n, i) => i === 0 || rango[niveles[i - 1]] <= rango[n]), niveles.join(","));

/* ---------------------------------------------------------------- */
m.titulo("Mis listas");

m.afirmar("empieza vacía", GMM.listas.total() === 0);
m.afirmar("añadir devuelve true", GMM.listas.alternar("favoritas", inter) === true);
m.afirmar("ahora la tiene", GMM.listas.tiene("favoritas", 157336));
m.afirmar("no está en pendientes", !GMM.listas.tiene("pendientes", 157336));
GMM.listas.alternar("pendientes", parasitos);
m.afirmar("total = 2", GMM.listas.total() === 2);
m.afirmar("quitar devuelve false", GMM.listas.alternar("favoritas", inter) === false);
m.afirmar("total = 1", GMM.listas.total() === 1);
m.afirmar("persiste en localStorage", global.__almacen["gmm_listas"].includes("496243"));

const copia = GMM.listas.exportar();
GMM.listas.vaciar("pendientes");
m.afirmar("vaciada", GMM.listas.total() === 0);
GMM.listas.importar(copia);
m.afirmar("importar restaura", GMM.listas.total() === 1);
let rechazado = false;
try { GMM.listas.importar('{"cosa":1}'); } catch (e) { rechazado = true; }
m.afirmar("rechaza un JSON con formato ajeno", rechazado);

/* ---------------------------------------------------------------- */
m.titulo("Utilidades");

m.afirmar("enumerar 3 elementos", GMM.util.enumerar(["A", "B", "C"]) === "A, B y C");
m.afirmar("enumerar 1 elemento", GMM.util.enumerar(["A"]) === "A");
m.afirmar("enumerar vacío", GMM.util.enumerar([]) === "");
m.afirmar("normalizar quita acentos", GMM.util.normalizar("Parásitos") === "parasitos");
m.afirmar("duración", GMM.util.duracion(169) === "2 h 49 min");
m.afirmar("duración exacta", GMM.util.duracion(120) === "2 h");
m.afirmar("escapar comillas", GMM.util.esc('<b>"x"</b>') === "&lt;b&gt;&quot;x&quot;&lt;/b&gt;");

/* ---------------------------------------------------------------- */
m.titulo("Búsqueda en el catálogo demo");

m.afirmar("busca sin acentos", GMM.demo.buscarPelicula("parasitos").length === 1);
m.afirmar("busca por título original", GMM.demo.buscarPelicula("Inception").length === 1);
m.afirmar("busca persona", GMM.demo.buscarPersona("penelope").length === 1);
m.afirmar("busca trama", GMM.demo.buscarTrama("viajes en el tiempo").length === 2);

/* ---------------------------------------------------------------- */
m.titulo("Coherencia del catálogo demo");

const idsPeliculas = GMM.demo.PELICULAS.map((p) => p.id);
m.afirmar("no hay ids repetidos", new Set(idsPeliculas).size === idsPeliculas.length);
m.afirmar("toda película tiene carátula", GMM.demo.PELICULAS.every((p) => p.poster_path));
m.afirmar("toda persona apunta a películas existentes",
  GMM.demo.PERSONAS.every((per) => per.creditos.every((id) => GMM.demo.porId(id))));
m.afirmar("toda trama apunta a películas existentes",
  Object.values(GMM.demo.TRAMAS).every((ids) => ids.every((id) => GMM.demo.porId(id))));

/* ---------------------------------------------------------------- */
m.titulo("Lotes con concurrencia limitada");

let simultaneas = 0, pico = 0;
const trabajo = Array.from({ length: 13 }, (_, i) => i);
GMM.util.enLotes(trabajo, 5, (n) => {
  simultaneas++; pico = Math.max(pico, simultaneas);
  return new Promise((res) => setTimeout(() => { simultaneas--; res(n * 2); }, 5));
}, () => {}).then((res) => {
  m.afirmar("respeta el tope de 5 simultáneas", pico <= 5, "pico " + pico);
  m.afirmar("devuelve los 13 resultados en orden",
    res.join(",") === trabajo.map((n) => n * 2).join(","));
  process.exit(m.resumir() ? 1 : 0);
});
