# GMM Server

Servidor multimedia personal de **GiveMyMovies**. Lee únicamente las carpetas que el
propietario configura y construye un catálogo local de sus archivos de vídeo. Ninguna
película se sube a Google Drive, Firebase ni otro almacenamiento en la nube.

## Estado de esta entrega

Esta es la **fase 1** del proyecto:

- configuración privada separada del repositorio;
- escaneo recursivo de una o varias carpetas;
- reconocimiento inicial del título y año desde el nombre del archivo;
- catálogo persistente y regenerable;
- confirmación en dos revisiones antes de marcar disponible un archivo nuevo o modificado;
- detección de discos o carpetas desconectados;
- API local protegida;
- ninguna operación para borrar o modificar películas;
- pruebas automáticas sin dependencias externas.

Todavía no incluye TMDB, reproducción, descarga, emparejamiento con la PWA ni acceso
remoto. Esas funciones se incorporarán por etapas después de validar este núcleo.

## Requisitos

- Windows de 64 bits.
- Node.js 22 o posterior.
- No necesita instalar paquetes de npm.

## Preparación

Abre PowerShell en esta carpeta y ejecuta una sola vez:

```powershell
npm.cmd run configurar
```

Se creará `PRIVADO/configuracion.json` con una clave aleatoria. La carpeta `PRIVADO`
está excluida del repositorio. Abre ese archivo y cambia `D:\\Peliculas` por la ruta
real de tu carpeta. Se pueden declarar varias carpetas con nombres distintos.

## Iniciar

Para actualizar el catálogo una sola vez y terminar:

```powershell
npm.cmd run escanear
```

Para dejar GMM Server funcionando y preparado para atender la aplicación:

```powershell
npm.cmd start
```

Con la configuración de ejemplo, el estado básico se puede comprobar en:

<http://127.0.0.1:7399/api/salud>

El catálogo completo exige la clave privada y está pensado para que lo consulte GMM,
no para exponerlo directamente en Internet.

## Probar

```powershell
npm.cmd test
```

Las pruebas crean películas ficticias dentro de una carpeta temporal. No recorren ni
modifican la biblioteca real del usuario.

## Convención de nombres recomendada

La identificación mejora si los archivos usan título y año:

```text
Dune Part Two (2024).mkv
The Matrix (1999) 1080p.mkv
Interestelar.2014.2160p.mp4
```

En la fase de TMDB habrá una revisión manual para los nombres ambiguos.
