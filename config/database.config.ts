import { Sequelize, Dialect } from "sequelize";
import { getenv } from "../app/Utils/common";

export const mongo = {
  url: getenv("MONGO_URL"),
};

const asBool = (value?: string, fallback = false) => {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
};

const dialect = (getenv("DB_DIALECT") as Dialect) || "mssql";
const host = getenv("DB_HOST");
const port = Number(getenv("DB_PORT") || 0) || undefined;
const username = getenv("DB_USER");
const password = getenv("DB_PASS");
const database = getenv("DB_NAME");

export const mysql = new Sequelize(database, username, password, {
  dialect,
  host,
  port,
  retry: {
    max: 5,
    match: [/SequelizeConnectionError/i, /ETIMEOUT/i, /ESOCKET/i],
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 70000,
    idle: 10000,
  },
  dialectOptions:
    dialect === "mssql"
      ? {
          options: {
            encrypt: asBool(getenv("DB_SSL"), true),
            trustServerCertificate: !asBool(
              getenv("DB_SSL_REJECT_UNAUTHORIZED"),
              true
            ),
            connectTimeout:
              Number(getenv("DB_CONNECT_TIMEOUT") || 15000) || 15000,
            requestTimeout:
              Number(getenv("DB_REQUEST_TIMEOUT") || 15000) || 15000,
          },
        }
      : {},
});

export default { mysql, mongo };
