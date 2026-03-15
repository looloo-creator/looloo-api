#!/usr/bin/env node

import http from "http";
import debugLib from "debug";
import app from "../app";

const debug = debugLib("one-pay-api:server");

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val: string) {
  const parsedPort = parseInt(val, 10);
  if (Number.isNaN(parsedPort)) {
    return val;
  }
  if (parsedPort >= 0) {
    return parsedPort;
  }
  return false;
}

function onError(error: NodeJS.ErrnoException) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind =
    typeof port === "string" ? "Pipe " + port : "Port " + String(port);

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind =
    typeof addr === "string" ? "pipe " + addr : "port " + String(addr?.port);
  debug("Listening on " + bind);
}
