# GMM Server

Servidor multimedia personal de **GiveMyMovies**. Lee únicamente las carpetas que el
propietario configura y construye un catálogo local de sus archivos de vídeo. Ninguna
película se sube a Google Drive, Firebase ni otro almacenamiento en la nube.

## Estado de esta entrega

Esta es la **fase 2** del proyecto:

- configuración privada separada del repositorio;
- escaneo recursivo de una o varias carpetas;
- reconocimiento inicial del título y año desde el nombre del archivo;
- catálogo persistente y regenerable;
- confirmación en dos revisiones antes de marcar disponible un archivo nuevo o modificado;
- detección de discos o carpetas desconectados;
- API local protegida;
- conexión desde la sección **▶ Te la tengo** de GiveMyMovies;
- enlaces temporales para reproducción y descarga, sin exponer la ruta física;
- reproducción HTTP con rangos, para poder avanzar y retroceder en formatos compatibles;
- ninguna operación para borrar o modificar películas;
- pruebas automáticas sin dependencias externas.

Las carátulas y fichas se resuelven desde la PWA con la clave personal de TMDB del usuario.
Todavía no incluye conversión de vídeo con FFmpeg ni acceso remoto: algunos MKV no se podrán
reproducir en el navegador y deberán descargarse. El acceso desde fuera de casa se configurará
con Tailscale, para no abrir puertos del router ni exponer este servidor a Internet.

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

## Iniciar (con la app GMM-Server, recomendado)

**`GMM-Server.vbs`**, en esta misma carpeta, abre una aplicación de escritorio para
manejar todo sin PowerShell ni ventanas negras:

- **Iniciar servidor** / **Detener servidor**, en un solo botón.
- **Escanear ahora**: refresca el catálogo sin reiniciar nada (usa `/api/escanear`,
  que ya trae el propio servidor).
- **Añadir carpeta...**: abre el selector nativo de Windows (el mismo de "Guardar
  como") para elegir una carpeta o disco sin escribir la ruta a mano; **Quitar
  carpeta** la retira de la lista. Los cambios de carpetas piden reiniciar el
  servidor para aplicarse — el resto de la ventana no.
- La **clave de administración**, visible con un botón **Copiar**, para pegarla
  directamente en ⚙ de GiveMyMovies.
- Si cierras la ventana con el servidor encendido, la app se oculta en la
  **bandeja del sistema** (junto al reloj) y el servidor sigue funcionando. Doble
  clic en el icono para volver a abrirla; clic derecho → **Detener servidor y
  salir** para apagarlo del todo.
- Solo deja abrir una copia a la vez: si haces doble clic de nuevo en
  `GMM-Server.vbs` mientras ya está abierta (aunque esté oculta en la bandeja), lo
  avisa en vez de intentar abrir un segundo servidor en el mismo puerto.

## Iniciar a mano (alternativa)

Para quien prefiera no usar la app, los mismos pasos con `.bat` o PowerShell:

- **`1-configurar-y-escanear.bat`**: abre `PRIVADO/configuracion.json` en el Bloc de
  notas para editar las carpetas, y al cerrarlo escanea una vez.
- **`2-iniciar-servidor.bat`**: deja el servidor encendido (equivale a `npm.cmd
  start`).

O directamente por PowerShell, para actualizar el catálogo una sola vez y terminar:

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

## Conectar GiveMyMovies

Con el servidor iniciado, abre GiveMyMovies y ve a **⚙ Ajustes**. En la sección **GMM Server**
escribe:

- Dirección local: `http://127.0.0.1:7399`
- Clave: el valor `claveAdministracion` de `PRIVADO/configuracion.json`

Pulsa **Probar conexión**. Después abre **▶ Te la tengo**: verás el catálogo, con los botones
**Ver** y **Descargar** para cada archivo disponible. La clave queda guardada únicamente en ese
navegador. Cada reproducción genera un enlace temporal que caduca por defecto a los 10 minutos;
puedes cambiarlo con `duracionEnlaceMinutos` (entre 1 y 60) en la configuración privada.

Para entrar desde el móvil fuera de casa no cambies todavía `host` ni abras el puerto 7399:
instala y configura primero Tailscale en el PC y en el dispositivo que reproducirá. Cuando esté
listo, se usará su URL HTTPS privada en este mismo campo de Ajustes.

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
