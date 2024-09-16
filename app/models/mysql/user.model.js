const sequelize = require("sequelize");
const db = require("../../../config/database.config").mysql;
const user = db.define(
    "user",
    {
        id: { type: sequelize.INTEGER, primaryKey: true },
        email: { type: sequelize.STRING },
        username: { type: sequelize.STRING },
        password: { type: sequelize.STRING },
        is_email_verified: { type: sequelize.BOOLEAN },
        email_verified_at: { type: sequelize.DATE },
        email_token: { type: sequelize.STRING },
        status: { type: sequelize.NUMBER },
        last_login: { type: sequelize.DATE },
        is_active: { type: sequelize.BOOLEAN },
        status: { type: sequelize.NUMBER },
    },
    {
        freezeTableName: false,
        timestamps: false,
    }
);
module.exports = user;