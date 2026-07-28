# Pruebas de givemymovies

**La aplicación no tiene dependencias.** Se abre con doble clic y punto. Esta carpeta es una
herramienta aparte, opcional, para comprobar que un cambio no rompió nada.

## Cómo se ejecutan

Desde la raíz del proyecto:

```bash
node pruebas/logica.js      # 57 comprobaciones · sin dependencias · instantáneo
node pruebas/imagenes.js    # 12 comprobaciones · necesita internet · ~30 s
node pruebas/interfaz.js    # 49 comprobaciones · necesita playwright-core · ~40 s
```

La primera vez, para la de interfaz:

```bash
cd pruebas
npm install playwright-core
```

Si no está instalado, `interfaz.js` lo dice y sale sin marcar fallo — no rompe nada.
Usa un Chromium ya descargado en la caché de Playwright; si no encuentra ninguno,
te indica cómo bajarlo (`npx playwright install chromium`).

## Qué comprueba cada una

| Archivo | Cubre |
|---|---|
| `logica.js` | Filtrado por idioma, plataforma y país · frase resumen · insignias de confianza · orden por confianza · listas de favoritas y pendientes · exportar/importar · utilidades · coherencia interna del catálogo demo · lotes con concurrencia limitada |
| `imagenes.js` | Que cada carátula y cada foto del catálogo demo **pertenecen de verdad a esa ficha**, no solo que devuelven 200 |
| `interfaz.js` | El recorrido real en Chromium: arranque, autocompletado, búsqueda, filtros en caliente, casos de idioma, listas, persistencia tras recargar, modo actor, modal, modo trama y móvil a 375 px |

`cargar.js` es la utilidad compartida: extrae el `<script>` de `index.html`, lo ejecuta con un
navegador simulado mínimo y devuelve `GMM`.

> Usa `vm.runInThisContext`, **no `eval`**. El `"use strict"` del script hace que `eval` cree
> su propio ámbito y las variables `var` nunca lleguen al global: `GMM` saldría `undefined`.

## Por qué existe `imagenes.js`

Un HTTP 200 en `image.tmdb.org` no prueba que la imagen sea de la película correcta.
En este proyecto ya pasó dos veces:

- El id `1417` **no** es *Volver*, es *El laberinto del fauno*. El correcto es **219**.
- El id `1281` **no** es Penélope Cruz, es Freddie Highmore. El correcto es **955**.

La comprobación fiable es leer `og:title` y `og:image` de la ficha pública de TMDB, que
siempre pertenecen a esa ficha. Y hay que pedirla con el mismo idioma que usa la app
(`?language=es-ES`), porque TMDB sirve una carátula distinta según el locale.

**Ejecuta esta prueba siempre que toques `GMM.demo`.**

## Capturas

`interfaz.js` deja cinco capturas en `pruebas/capturas/`. Sirven para revisar de un vistazo
que el aspecto no se rompió. No se versionan.
