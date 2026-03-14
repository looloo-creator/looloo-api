const sequelize = require("sequelize");
const db = require("../../../config/database.config").mysql;
const user = db.define(
    "user",
    {
        id: {
            type: sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        email: { type: sequelize.STRING },
        username: { type: sequelize.STRING },
        password: { type: sequelize.STRING },
        is_email_verified: { type: sequelize.INTEGER },
        email_verified_at: { type: sequelize.DATE },
        email_token: { type: sequelize.STRING },
        refresh_token: { type: sequelize.STRING },
        status: { type: sequelize.INTEGER },
        last_login: { type: sequelize.DATE },
        is_active: { type: sequelize.INTEGER },
    },
    {
        freezeTableName: false,
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
module.exports = user;
