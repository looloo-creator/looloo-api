import { Sequelize, Dialect } from "sequelize";
import { getenv } from "../app/Utils/common";

const asBool = (value?: string, fallback = false) => {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
};

const host = getenv("DB_HOST");
const port = Number(getenv("DB_PORT") || 0) || undefined;
const username = getenv("DB_USER");
const password = getenv("DB_PASS");
const database = getenv("DB_NAME");

export const postgres = new Sequelize(database, username, password, {
  dialect: "postgres" as Dialect,
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
  dialectOptions: asBool(getenv("DB_SSL"))
    ? { ssl: { require: true, rejectUnauthorized: asBool(getenv("DB_SSL_REJECT_UNAUTHORIZED"), true) } }
    : {},
});

export default { postgres };
