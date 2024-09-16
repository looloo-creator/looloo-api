/* Mongo Credentials */
const sequelize = require("sequelize");
const { getenv } = require("../app/Utils/common");

module.exports.mongo = {
  url: getenv("MONGO_URL")
}

/* Mysql Connection */
module.exports.mysql = new sequelize(
  getenv("MYSQL_DATABASE"),
  getenv("MYSQL_USERNAME"),
  getenv("MYSQL_PASSWORD"),
  {
    dialect: "mysql",
    host: getenv("MYSQL_HOST"),
  }
);
