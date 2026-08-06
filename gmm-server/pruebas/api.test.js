"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { crearServidorApi } = require("../src/api");

function catalogoDePrueba() {
  return {
    version: 1,
    actualizadoEn: "2026-08-05T00:00:00.000Z",
    resumen: { total: 1, disponibles: 1, carpetas: 1 },
    carpetas: [{ nombre: "Prueba", disponible: true, peliculas: 1 }],
    peliculas: [{ id: "abc", tituloDetectado: "Prueba", disponible: true }]
  };
}

async function levantar(t) {
  const gestor = {
    obtenerPublico: catalogoDePrueba,
    escanearConfirmando: async function () { return catalogoDePrueba(); }
  };
  const configuracion = {
    nombreServidor: "GMM de prueba",
    claveAdministracion: "secreto-de-prueba-12345678901234567890",
    origenesPermitidos: ["https://alberthoma.github.io"]
  };
  const registro = { error: function () {} };
  const servidor = crearServidorApi(configuracion, gestor, registro);
  servidor.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  t.after(function () { servidor.close(); });
  return `http://127.0.0.1:${servidor.address().port}`;
}

test("publica salud sin revelar datos del catálogo a quien no se autentica", async function (t) {
  const base = await levantar(t);
  const respuesta = await fetch(`${base}/api/salud`);
  const datos = await respuesta.json();
  assert.equal(respuesta.status, 200);
  assert.equal(datos.estado, "ok");
  assert.equal(Object.hasOwn(datos, "peliculas"), false);
  assert.equal(Object.hasOwn(datos, "carpetas"), false);

  const autenticada = await fetch(`${base}/api/salud`, {
    headers: { Authorization: "Bearer secreto-de-prueba-12345678901234567890" }
  });
  assert.equal((await autenticada.json()).peliculas, 1);
});

test("protege catálogo y escaneo con la clave", async function (t) {
  const base = await levantar(t);
  const denegada = await fetch(`${base}/api/catalogo`);
  assert.equal(denegada.status, 401);

  const permitida = await fetch(`${base}/api/catalogo`, {
    headers: { Authorization: "Bearer secreto-de-prueba-12345678901234567890" }
  });
  assert.equal(permitida.status, 200);
  assert.equal((await permitida.json()).resumen.total, 1);

  const escaneo = await fetch(`${base}/api/escanear`, {
    method: "POST",
    headers: { "X-GMM-Clave": "secreto-de-prueba-12345678901234567890" }
  });
  assert.equal(escaneo.status, 200);
});

test("acepta el origen de GMM y rechaza otros", async function (t) {
  const base = await levantar(t);
  const permitida = await fetch(`${base}/api/salud`, {
    headers: { Origin: "https://alberthoma.github.io" }
  });
  assert.equal(permitida.status, 200);
  assert.equal(permitida.headers.get("access-control-allow-origin"), "https://alberthoma.github.io");

  const denegada = await fetch(`${base}/api/salud`, {
    headers: { Origin: "https://ejemplo-malicioso.invalid" }
  });
  assert.equal(denegada.status, 403);
});
