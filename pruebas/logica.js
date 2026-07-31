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
m.titulo("Disponible, pero no en esa plataforma");

/* El caso real que motivó esta distinción: 'Siempre el mismo día' está
   en 14 países hispanohablantes pero en ninguno la tiene Netflix.
   Decir "sin resultados" sería técnicamente cierto e inútil. */
const coco = GMM.demo.porId(354912);            // solo está en Disney Plus
r = GMM.idioma.filtrar(GMM.demo.proveedoresComoTmdb(coco),
  { plataforma: "Netflix", pais: "", idioma: "es", mostrarTodos: false }, coco.original_language);
m.afirmar("ningún país con Netflix", r.paises.length === 0);
m.afirmar("pero cuenta los que sí tienen oferta", r.descartadosPorPlataforma > 0,
  "fueron " + r.descartadosPorPlataforma);

frase = GMM.idioma.frase(coco.title, r, { plataforma: "Netflix", idioma: "es" });
m.nota(frase.html.replace(/<[^>]+>/g, ""));
m.afirmar("la frase nombra la plataforma que falla", frase.html.includes("no en Netflix"));
m.afirmar("y aclara que sí está disponible", frase.html.includes("sí está disponible"));

r = GMM.idioma.filtrar(GMM.demo.proveedoresComoTmdb(coco),
  { plataforma: "Disney Plus", pais: "", idioma: "es", mostrarTodos: false }, coco.original_language);
m.afirmar("con la plataforma correcta sí hay países", r.paises.length > 0);
m.afirmar("y no descarta ninguno", r.descartadosPorPlataforma === 0);

r = GMM.idioma.filtrar(provInter,
  { plataforma: "", pais: "", idioma: "es", mostrarTodos: false }, "en");
m.afirmar("sin filtro de plataforma, no se descarta nada", r.descartadosPorPlataforma === 0);

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
m.afirmar("busca trama (películas)", GMM.demo.buscarTrama("viajes en el tiempo", "movie").length === 2);
m.afirmar("busca serie por título", GMM.demo.buscarSerie("casa").some((s) => s.id === 71446));
m.afirmar("busca serie por nombre original", GMM.demo.buscarSerie("오징어").length === 1);
m.afirmar("busca trama en series", GMM.demo.buscarTrama("atraco", "tv").some((s) => s.id === 71446));
m.afirmar("trama de película no arrastra series", GMM.demo.buscarTrama("atraco", "movie").every((p) => p.tipo === "movie"));

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
m.titulo("Normalización de series");

const serieCruda = { id: 1, name: "X", original_name: "X", first_air_date: "2020-03-01", episode_run_time: [48] };
const norm = GMM.util.normalizarMedia(serieCruda, "tv");
m.afirmar("marca el tipo tv", norm.tipo === "tv");
m.afirmar("name pasa a title", norm.title === "X");
m.afirmar("first_air_date pasa a release_date", norm.release_date === "2020-03-01");
m.afirmar("episode_run_time pasa a runtime", norm.runtime === 48);
m.afirmar("no muta el objeto original", serieCruda.tipo === undefined);
const normPeli = GMM.util.normalizarMedia({ id: 2, title: "P" }, "movie");
m.afirmar("una película conserva su title", normPeli.title === "P" && normPeli.tipo === "movie");

/* ---------------------------------------------------------------- */
m.titulo("Sección Descubrir sobre el catálogo demo");

m.afirmar("series de drama incluyen Breaking Bad",
  GMM.demo.descubrir("tv", { genero: 18 }).some((s) => s.id === 1396));
m.afirmar("series de drama con nota >= 8 dejan fuera El juego del calamar",
  !GMM.demo.descubrir("tv", { genero: 18, notaMin: 8 }).some((s) => s.id === 93405));
m.afirmar("pelis de ciencia ficción incluyen Interestelar y Matrix", (() => {
  const r = GMM.demo.descubrir("movie", { genero: 878 }).map((p) => p.id);
  return r.includes(157336) && r.includes(603);
})());
m.afirmar("filtrar por año exacto",
  GMM.demo.descubrir("movie", { ano: "1999" }).every((p) => GMM.util.ano(p.release_date) === "1999"));
m.afirmar("ordena por nota descendente", (() => {
  const r = GMM.demo.descubrir("tv", {});
  for (let i = 1; i < r.length; i++) if (r[i - 1].vote_average < r[i].vote_average) return false;
  return true;
})());
m.afirmar("los géneros de serie difieren de los de película",
  GMM.datos.generos("tv") !== GMM.datos.generos("movie") &&
  GMM.datos.generos("tv").some((g) => g.id === 10765));

/* ---------------------------------------------------------------- */
m.titulo("Descubrir: intervalo de años");

const anosDe = (r) => r.map((p) => Number(GMM.util.ano(p.release_date || p.first_air_date)));

m.afirmar("el intervalo deja fuera lo anterior y lo posterior", (() => {
  const a = anosDe(GMM.demo.descubrir("movie", { anoDesde: "2010", anoHasta: "2019" }));
  return a.length > 1 && a.every((n) => n >= 2010 && n <= 2019);
})());
m.afirmar("solo 'desde' no pone techo",
  anosDe(GMM.demo.descubrir("movie", { anoDesde: "2010" })).every((n) => n >= 2010));
m.afirmar("solo 'hasta' no pone suelo",
  anosDe(GMM.demo.descubrir("movie", { anoHasta: "2001" })).every((n) => n <= 2001));
m.afirmar("un intervalo de un solo año equivale al año exacto", (() => {
  const uno = GMM.demo.descubrir("movie", { anoDesde: "1999", anoHasta: "1999" }).map((p) => p.id);
  const exacto = GMM.demo.descubrir("movie", { ano: "1999" }).map((p) => p.id);
  return uno.length === 1 && uno.join() === exacto.join();
})());
m.afirmar("el año exacto manda sobre el intervalo, como en el recorrido año a año",
  GMM.demo.descubrir("movie", { ano: "1999", anoDesde: "2010", anoHasta: "2019" }).length === 0);

/* ---------------------------------------------------------------- */
m.titulo("Descubrir: orden");

m.afirmar("hay una clave de TMDB para cada orden, en cine y en series",
  ["popular", "reciente", "antigua", "nota"].every((k) =>
    GMM.config.ORDENES[k] && GMM.config.ORDENES[k].movie && GMM.config.ORDENES[k].tv));
m.afirmar("cine y series nombran distinto el orden por fecha",
  GMM.config.ORDENES.reciente.movie === "primary_release_date.desc" &&
  GMM.config.ORDENES.reciente.tv === "first_air_date.desc");
m.afirmar("ordenar por nota exige más votos que el resto",
  GMM.config.VOTOS_MIN_NOTA > GMM.config.VOTOS_MIN);

const ordenado = (a, sentido) => {
  for (let i = 1; i < a.length; i++) {
    if (sentido === "desc" ? a[i - 1] < a[i] : a[i - 1] > a[i]) return false;
  }
  return true;
};

m.afirmar("'más recientes' ordena de año mayor a menor",
  ordenado(anosDe(GMM.demo.descubrir("movie", { orden: "reciente" })), "desc"));
m.afirmar("'más antiguas' ordena de año menor a mayor",
  ordenado(anosDe(GMM.demo.descubrir("movie", { orden: "antigua" })), "asc"));
m.afirmar("'mayor puntuación' sola ordena por nota, no por año",
  ordenado(GMM.demo.descubrir("movie", { porNota: true }).map((p) => p.vote_average), "desc"));
m.afirmar("sin orden pedido no se altera el comportamiento de siempre",
  GMM.demo.descubrir("tv", {}).map((s) => s.id).join() ===
  GMM.demo.descubrir("tv", { orden: "popular" }).map((s) => s.id).join());
m.afirmar("año y nota a la vez: el año sigue mandando", (() => {
  const a = anosDe(GMM.demo.descubrir("movie", { orden: "reciente", porNota: true }));
  return a.length > 1 && ordenado(a, "desc");
})());
m.afirmar("año y nota a la vez, hacia atrás: el año sigue mandando", (() => {
  const a = anosDe(GMM.demo.descubrir("movie", { orden: "antigua", porNota: true }));
  return a.length > 1 && ordenado(a, "asc");
})());

/* ---------------------------------------------------------------- */
m.titulo("Coherencia de las series demo");

m.afirmar("toda serie tiene al menos un género", GMM.demo.SERIES.every((s) => (s.genre_ids || []).length));
m.afirmar("toda serie declara idioma original", GMM.demo.SERIES.every((s) => s.original_language));
m.afirmar("toda serie tiene carátula", GMM.demo.SERIES.every((s) => s.poster_path));
m.afirmar("no hay ids de serie repetidos",
  new Set(GMM.demo.SERIES.map((s) => s.id)).size === GMM.demo.SERIES.length);

/* ---------------------------------------------------------------- */
m.titulo("Listas conscientes del tipo (peli y serie con el mismo id)");

GMM.listas.alternar("favoritas", { id: 500, tipo: "movie", title: "Peli" });
GMM.listas.alternar("favoritas", { id: 500, tipo: "tv", title: "Serie" });
m.afirmar("guarda peli y serie del mismo id sin pisarse",
  GMM.listas.tiene("favoritas", 500, "movie") && GMM.listas.tiene("favoritas", 500, "tv"));
GMM.listas.quitar("favoritas", 500, "movie");
m.afirmar("quitar la peli no toca la serie",
  !GMM.listas.tiene("favoritas", 500, "movie") && GMM.listas.tiene("favoritas", 500, "tv"));
GMM.listas.quitar("favoritas", 500, "tv");

/* ---------------------------------------------------------------- */
m.titulo("Títulos alternativos por país");

const altPeli = {
  title: "Duro de matar", original_title: "Die Hard", original_language: "en",
  alternative_titles: { titles: [
    { iso_3166_1: "ES", title: "La jungla de cristal" },
    { iso_3166_1: "AR", title: "Duro de matar" },   // igual al principal → fuera
    { iso_3166_1: "US", title: "Die Hard" },         // igual al original → fuera
    { iso_3166_1: "FR", title: "Piège de cristal" }  // FR no es mercado es/en → fuera
  ] }
};
let alt = GMM.util.titulosAlternativos(altPeli);
m.afirmar("agrupa un único título alternativo relevante", alt.length === 1, "fueron " + alt.length);
m.afirmar("es «La jungla de cristal» (España)",
  alt.length === 1 && alt[0].titulo === "La jungla de cristal" && alt[0].paises.indexOf("ES") !== -1);
m.afirmar("descarta el principal y el original",
  !alt.some((a) => /Duro de matar|Die Hard/.test(a.titulo)));
m.afirmar("descarta países fuera de mercados español/inglés",
  !alt.some((a) => a.titulo === "Piège de cristal"));
m.afirmar("funciona con series (clave results)",
  GMM.util.titulosAlternativos({ name: "X", original_name: "X",
    alternative_titles: { results: [{ iso_3166_1: "ES", title: "Equis" }] } }).length === 1);
m.afirmar("sin alternative_titles devuelve vacío",
  GMM.util.titulosAlternativos({ title: "Y" }).length === 0);

/* ---------------------------------------------------------------- */
m.titulo("OMDb: parseo de notas (IMDb / Rotten Tomatoes / Metacritic)");

const omdbCompleto = {
  Response: "True",
  imdbRating: "8.7",
  Metascore: "74",
  Ratings: [
    { Source: "Internet Movie Database", Value: "8.7/10" },
    { Source: "Rotten Tomatoes", Value: "73%" },
    { Source: "Metacritic", Value: "74/100" }
  ]
};
let notas = GMM.omdb.parsear(omdbCompleto);
m.afirmar("extrae la nota de IMDb", notas && notas.imdb === "8.7");
m.afirmar("extrae Rotten Tomatoes tal cual (porcentaje)", notas && notas.rt === "73%");
m.afirmar("Metacritic sin el '/100'", notas && notas.meta === "74");

m.afirmar("Response:'False' devuelve null", GMM.omdb.parsear({ Response: "False", Error: "Movie not found!" }) === null);
m.afirmar("respuesta nula devuelve null", GMM.omdb.parsear(null) === null);
m.afirmar("sin ninguna nota aprovechable devuelve null",
  GMM.omdb.parsear({ Response: "True", imdbRating: "N/A", Ratings: [] }) === null);

let soloImdb = GMM.omdb.parsear({ Response: "True", imdbRating: "6.1", Ratings: [] });
m.afirmar("con solo IMDb, rt y meta quedan indefinidos",
  soloImdb && soloImdb.imdb === "6.1" && !soloImdb.rt && !soloImdb.meta);

m.afirmar("ignora valores 'N/A' dentro de Ratings",
  (() => {
    const n = GMM.omdb.parsear({ Response: "True", Ratings: [{ Source: "Rotten Tomatoes", Value: "N/A" }], imdbRating: "5.0" });
    return n && n.imdb === "5.0" && !n.rt;
  })());
m.afirmar("Metascore de reserva cuando no viene en Ratings",
  (() => {
    const n = GMM.omdb.parsear({ Response: "True", imdbRating: "7.0", Metascore: "61", Ratings: [] });
    return n && n.meta === "61";
  })());

/* ---------------------------------------------------------------- */
/* Desde V GMM 0023 los carruseles se ordenan por la nota de TMDB, no por la de
   IMDb: con cinco carruseles de veinte cargando a la vez, el rodeo por OMDb
   costaba ~120 consultas por visita sobre un tope de 1.000 al día. La nota que
   ordena la lista es además la que luce cada tarjeta. */
m.titulo("Carruseles: top por nota de TMDB (GMM.util.mejoresPorNota)");

const cand = [
  { id: 1, title: "A", vote_average: 8.7 },
  { id: 2, title: "B", vote_average: 5.9 },   // < 6: fuera
  { id: 3, title: "C", vote_average: 7.4 },
  { id: 4, title: "D", vote_average: null },  // sin nota: fuera
  { id: 5, title: "E", vote_average: 6.0 },   // exactamente 6: dentro (umbral >=)
  { id: 6, title: "F", vote_average: 9.1 }
];
let mejores = GMM.util.mejoresPorNota(cand, 20);
m.afirmar("descarta nota < 6 y los que no tienen nota", mejores.length === 4, "fueron " + mejores.length);
m.afirmar("ordena de mayor a menor nota",
  mejores.map((x) => x.id).join(",") === "6,1,3,5", mejores.map((x) => x.id).join(","));
m.afirmar("corta al tope pedido",
  GMM.util.mejoresPorNota(cand, 2).map((x) => x.id).join(",") === "6,1");
m.afirmar("6 exacto sí pasa el umbral (>=, es el mismo que pide /discover)",
  GMM.util.mejoresPorNota(cand, 20).some((x) => x.id === 5));
m.afirmar("admite un umbral distinto del de config",
  GMM.util.mejoresPorNota(cand, 20, 8).map((x) => x.id).join(",") === "6,1");
m.afirmar("lista vacía o sin notas devuelve vacío",
  GMM.util.mejoresPorNota([], 20).length === 0 &&
  GMM.util.mejoresPorNota([{ id: 9, vote_average: null }], 20).length === 0);

/* ---------------------------------------------------------------- */
m.titulo("Carruseles: uno por categoría (V GMM 0023)");

m.afirmar("hay cinco categorías en el config",
  GMM.config.CATEGORIAS_SUGERENCIA.length === 5);
m.afirmar("veinte títulos por carrusel", GMM.config.TOP_CATEGORIA === 20);
m.afirmar("tres categorías tienen intervalo (las que llevan «Ver más»)",
  GMM.config.CATEGORIAS_SUGERENCIA.filter((c) => c.anoDesde).length === 3);
m.afirmar("el umbral de nota de las categorías es 6",
  GMM.config.NOTA_MIN_CATEGORIA === 6);

/* ---------------------------------------------------------------- */
m.titulo("Filmografía con facetas: intérprete y dirección (V GMM 0024)");

const creditos = {
  cast: [
    { id: 10, title: "Peli A", popularity: 5 },
    { id: 11, title: "Peli B", popularity: 9 },
    { id: 10, title: "Peli A (otro papel)", popularity: 3 }  // id repetido: una sola vez
  ],
  crew: [
    { id: 11, title: "Peli B", popularity: 9, job: "Director" }, // dirige Y actúa → cuenta como dirección
    { id: 20, title: "Peli C", popularity: 7, job: "Director" },
    { id: 21, title: "Peli D", popularity: 1, job: "Producer" }  // no dirige: se ignora
  ]
};
const fac = GMM.util.filmografiaConFacetas(creditos, "movie");
m.afirmar("dirige = crew con job Director, ordenado por popularidad",
  fac.dirige.map((x) => x.id).join(",") === "11,20", fac.dirige.map((x) => x.id).join(","));
m.afirmar("interpreta deduplica por id y excluye lo que ya dirige",
  fac.interpreta.map((x) => x.id).join(",") === "10", fac.interpreta.map((x) => x.id).join(","));
m.afirmar("cada ítem lleva su faceta marcada",
  fac.dirige.every((x) => x.faceta === "dirige") && fac.interpreta.every((x) => x.faceta === "interpreta"));
m.afirmar("normaliza el tipo en los ítems", fac.dirige[0].tipo === "movie");
m.afirmar("créditos vacíos devuelven dos listas vacías",
  (() => { const f = GMM.util.filmografiaConFacetas({}, "movie"); return f.interpreta.length === 0 && f.dirige.length === 0; })());

/* ---------------------------------------------------------------- */
m.titulo("Ficha técnica del título (V GMM 0024)");

const peliFT = {
  tipo: "movie",
  production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
  production_companies: [{ name: "Warner Bros." }, { name: "Legendary" }],
  credits: {
    cast: [
      { name: "Actriz 1", character: "Heroína", profile_path: "/a.jpg" },
      { name: "Actor 2", character: "Villano" }
    ],
    crew: [
      { name: "Dir Uno", job: "Director", department: "Directing" },
      { name: "Guionista", job: "Screenplay", department: "Writing" },
      { name: "Compositor", job: "Original Music Composer", department: "Sound" },
      { name: "Foto", job: "Director of Photography", department: "Camera" },
      { name: "Ignorado", job: "Gaffer", department: "Lighting" }
    ]
  }
};
const ft = GMM.util.fichaTecnica(peliFT);
m.afirmar("dirección sale del crew con job Director", ft.direccion.join(",") === "Dir Uno");
m.afirmar("guion sale del departamento Writing", ft.guion.join(",") === "Guionista");
m.afirmar("música y fotografía por su job",
  ft.musica.join(",") === "Compositor" && ft.fotografia.join(",") === "Foto");
m.afirmar("productoras conservan el orden", ft.productoras.join(",") === "Warner Bros.,Legendary");
m.afirmar("país se traduce por su código ISO", ft.paises.length === 1 && ft.paises[0].length > 2);
m.afirmar("reparto se corta y guarda personaje y foto",
  ft.reparto.length === 2 && ft.reparto[0].personaje === "Heroína" && ft.reparto[0].foto === "/a.jpg");
m.afirmar("tieneFichaTecnica es true cuando hay datos", GMM.util.tieneFichaTecnica(ft) === true);

const serieFT = { tipo: "tv", created_by: [{ name: "Creadora 1" }, { name: "Creador 2" }], credits: { cast: [], crew: [] } };
const ftv = GMM.util.fichaTecnica(serieFT);
m.afirmar("en serie la dirección es la creación (created_by)",
  ftv.esTv === true && ftv.direccion.join(",") === "Creadora 1,Creador 2");
m.afirmar("ficha vacía no tiene ficha técnica que enseñar",
  GMM.util.tieneFichaTecnica(GMM.util.fichaTecnica({})) === false);

/* ---------------------------------------------------------------- */
m.titulo("Colecciones de Descubrir: Marvel, DC, Anime, Hindi (V GMM 0024)");

m.afirmar("hay cuatro colecciones en el config", GMM.datos.COLECCIONES.length === 4);
m.afirmar("cada colección lleva clave, nombre y params",
  GMM.datos.COLECCIONES.every((c) => c.clave && c.nombre && c.params && Object.keys(c.params).length));
m.afirmar("esColeccion distingue la clave prefijada de un id de género",
  GMM.datos.esColeccion("col:marvel") === true && GMM.datos.esColeccion("28") === false && GMM.datos.esColeccion("") === false);
m.afirmar("coleccion() resuelve por clave", GMM.datos.coleccion("col:marvel").nombre === "Marvel (MCU)");
m.afirmar("Marvel y DC usan keyword; Anime e Hindi, idioma original",
  GMM.datos.coleccion("col:marvel").params.with_keywords === "180547" &&
  GMM.datos.coleccion("col:dc").params.with_keywords.indexOf("229266") !== -1 &&
  GMM.datos.coleccion("col:anime").params.with_original_language === "ja" &&
  GMM.datos.coleccion("col:hindi").params.with_original_language === "hi");
m.afirmar("Anime combina animación con idioma japonés",
  GMM.datos.coleccion("col:anime").params.with_genres === "16");

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
