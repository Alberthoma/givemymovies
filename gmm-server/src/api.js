"use strict";

const crypto = require("node:crypto");
const http = require("node:http");

const VERSION_SERVIDOR = "0.1.0";

function responderJson(respuesta, estado, contenido) {
  const cuerpo = JSON.stringify(contenido);
  respuesta.writeHead(estado, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(cuerpo),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer"
  });
  respuesta.end(cuerpo);
}

function origenPermitido(origen, configuracion) {
  if (!origen) return true;
  if (configuracion.origenesPermitidos.includes(origen)) return true;
  try {
    const url = new URL(origen);
    return (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      (url.protocol === "http:" || url.protocol === "https:");
  } catch (error) {
    return false;
  }
}

function aplicarCors(solicitud, respuesta, configuracion) {
  const origen = solicitud.headers.origin;
  if (!origen) return true;
  if (!origenPermitido(origen, configuracion)) return false;
  respuesta.setHeader("Access-Control-Allow-Origin", origen);
  respuesta.setHeader("Vary", "Origin");
  respuesta.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  respuesta.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-GMM-Clave");
  respuesta.setHeader("Access-Control-Max-Age", "600");
  if (solicitud.headers["access-control-request-private-network"] === "true") {
    respuesta.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  return true;
}

function esDireccionLocal(direccion) {
  return direccion === "127.0.0.1" || direccion === "::1" || direccion === "::ffff:127.0.0.1";
}

function secretosIguales(recibido, esperado) {
  const a = Buffer.from(String(recibido || ""));
  const b = Buffer.from(String(esperado || ""));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function autorizado(solicitud, configuracion) {
  if (!configuracion.claveAdministracion) return esDireccionLocal(solicitud.socket.remoteAddress);
  const cabecera = String(solicitud.headers.authorization || "");
  const bearer = cabecera.startsWith("Bearer ") ? cabecera.slice(7).trim() : "";
  const clave = bearer || solicitud.headers["x-gmm-clave"];
  return secretosIguales(clave, configuracion.claveAdministracion);
}

function crearServidorApi(configuracion, gestorCatalogo, registro) {
  const log = registro || console;
  return http.createServer(async function (solicitud, respuesta) {
    if (!aplicarCors(solicitud, respuesta, configuracion)) {
      responderJson(respuesta, 403, { error: "Origen no permitido" });
      return;
    }
    if (solicitud.method === "OPTIONS") {
      respuesta.writeHead(204);
      respuesta.end();
      return;
    }

    const url = new URL(solicitud.url, "http://gmm-server.local");
    try {
      if (solicitud.method === "GET" && url.pathname === "/") {
        responderJson(respuesta, 200, {
          servicio: "GMM Server",
          version: VERSION_SERVIDOR,
          mensaje: "Servidor multimedia personal de GiveMyMovies"
        });
        return;
      }
      if (solicitud.method === "GET" && url.pathname === "/api/salud") {
        const catalogo = gestorCatalogo.obtenerPublico();
        const salud = {
          estado: "ok",
          servicio: configuracion.nombreServidor,
          version: VERSION_SERVIDOR,
          protegido: Boolean(configuracion.claveAdministracion)
        };
        if (autorizado(solicitud, configuracion)) {
          salud.catalogoActualizadoEn = catalogo.actualizadoEn;
          salud.peliculas = catalogo.resumen.total;
          salud.disponibles = catalogo.resumen.disponibles;
        }
        responderJson(respuesta, 200, salud);
        return;
      }
      if (url.pathname === "/api/catalogo" || url.pathname === "/api/escanear") {
        if (!autorizado(solicitud, configuracion)) {
          responderJson(respuesta, 401, { error: "Acceso no autorizado" });
          return;
        }
      }
      if (solicitud.method === "GET" && url.pathname === "/api/catalogo") {
        responderJson(respuesta, 200, gestorCatalogo.obtenerPublico());
        return;
      }
      if (solicitud.method === "POST" && url.pathname === "/api/escanear") {
        responderJson(respuesta, 200, await gestorCatalogo.escanearConfirmando());
        return;
      }
      responderJson(respuesta, 404, { error: "Ruta no encontrada" });
    } catch (error) {
      log.error("Fallo atendiendo una solicitud de GMM Server:", error);
      responderJson(respuesta, 500, { error: "Error interno del servidor" });
    }
  });
}

module.exports = {
  VERSION_SERVIDOR,
  autorizado,
  crearServidorApi,
  esDireccionLocal,
  origenPermitido,
  secretosIguales
};
