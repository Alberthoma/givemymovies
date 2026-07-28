# Respaldos

Copia de la **app completa** tal como quedó en cada versión, **antes** de empezar a
modificarla para la siguiente. Sirve para volver atrás de un vistazo o comparar sin
depender de git.

## Qué hay en cada carpeta

Una carpeta por versión, con nombre `V-GMM-XXXX`. Dentro, lo que cambia de una versión a
otra:

```
V-GMM-XXXX/
├── index.html      · la aplicación completa
├── sw.js           · service worker
└── manifest.json   · manifiesto de la PWA
```

**No se guardan los iconos** (`iconos/`): son la parte pesada y apenas cambian entre
versiones, así que duplicarlos en cada respaldo solo engordaría el repositorio. Están en
`iconos/` en la raíz, versionados como cualquier otro archivo; si alguna vez hiciera falta
reconstruir una versión antigua al pie de la letra, se recuperan del historial de git.

Tampoco se guardan los documentos (`CLAUDE.md`, `PROMPT-MAESTRO.md`, `README.md`) ni la
carpeta `pruebas/`: eso ya lo conserva git.

## Cuándo se crea uno

**Antes de tocar el código de una versión publicada**, se copia su estado a `V-GMM-XXXX/`.
Así, si la versión en curso rompe algo, la anterior sigue ahí, intacta y ejecutable.

## Por qué se versiona en git

Estos respaldos **sí se guardan en el repositorio**, a propósito. Son la red de seguridad
ante un cambio que salga mal: si al modificar una versión se rompe algo —hasta lo menos
pensado—, la anterior sigue aquí, completa y ejecutable, se trabaje desde el PC o desde un
entorno remoto y efímero. Por eso **no** están en `.gitignore`: si solo vivieran en local,
el trabajo hecho fuera del PC se quedaría sin respaldo.

Sí, duplica algún dato respecto al historial de git, pero es el precio de tener la copia
como carpeta abrible de un doble clic y no como un estado que hay que reconstruir con git.
