"use strict";

const { cargarConfiguracion } = require("./src/configuracion");
const { GestorCatalogo } = require("./src/catalogo");
const { crearServidorApi, VERSION_SERVIDOR } = require("./src/api");

async function iniciar() {
  const configuracion = cargarConfiguracion(process.argv[2]);
  const gestor = new GestorCatalogo(configuracion);
  await gestor.iniciar();

  if (configuracion.escanearAlIniciar) {
    const catalogo = await gestor.escanearConfirmando();
    console.log(`Catálogo revisado: ${catalogo.resumen.total} película(s).`);
  }

  const servidor = crearServidorApi(configuracion, gestor, console);
  servidor.listen(configuracion.puerto, configuracion.host, function () {
    console.log(`GMM Server ${VERSION_SERVIDOR} está funcionando.`);
    console.log(`Dirección local: http://${configuracion.host}:${configuracion.puerto}`);
    console.log(`Carpetas configuradas: ${configuracion.carpetas.length}`);
    console.log("Pulsa Ctrl+C para detenerlo.");
  });

  let temporizador = null;
  if (configuracion.intervaloEscaneoMinutos > 0) {
    temporizador = setInterval(function () {
      gestor.escanear().catch(function (error) {
        console.error("No se pudo actualizar el catálogo:", error.message);
      });
    }, configuracion.intervaloEscaneoMinutos * 60 * 1000);
    temporizador.unref();
  }

  function cerrar(senal) {
    console.log(`\n${senal}: deteniendo GMM Server…`);
    if (temporizador) clearInterval(temporizador);
    servidor.close(function () { process.exit(0); });
    setTimeout(function () { process.exit(1); }, 5000).unref();
  }
  process.once("SIGINT", function () { cerrar("SIGINT"); });
  process.once("SIGTERM", function () { cerrar("SIGTERM"); });
}

iniciar().catch(function (error) {
  console.error("GMM Server no pudo iniciar:");
  console.error(error.message);
  process.exitCode = 1;
});
