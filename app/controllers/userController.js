const model = require('../models/index');
const { Op } = require("sequelize");
const Responser = require("../response/index");
let Validator = require('validatorjs');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getenv } = require('../Utils/common');
const { USERSTATUS } = require('../../config/custom.config');

const create = async (req, res) => {

    let validation = new Validator(req.body, {
        email: 'required|email',
        password: 'required|min:6'
    });

    let response;

    if (validation.passes()) {
        try {
            const password = await bcrypt.hash(req.body.password, 10);

            const token = jwt.sign(
                { email: req.body.email, type: "verify_email" },
                getenv("JWT_SECRET_KEY"),
                {
                    expiresIn: "2d",
                }
            );
            let userData = {
                email: req.body.email,
                password: password,
                email_token: token
            }
            const checkData = await model.user.findOne({
                where: {
                    [Op.or]: {
                        email: req.body.email
                    },
                },
            });
            if (checkData) {
                if (checkData.is_email_verified) {
                    response = Responser.custom("R206");
                } else {
                    response = Responser.custom("R207");
                }
            } else {
                await model.user
                    .create(userData)
                    .then((result) => {
                        delete userData.password;
                        response = Responser.custom("R201");
                    });
            }
        } catch (error) {
            console.log(error)
            response = Responser.error(error);
        }
    } else {
        response = Responser.validationfail(validation.errors)
    }
    return res.status(response.statusCode).send(response.data);
}

const login = async (req, res) => {

    let validation = new Validator(req.body, {
        email: 'required|email'
    });

    let response;
    if (validation.passes()) {
        try {
            const userData = await model.user.findOne({
                where: {
                    email: req.body.email
                },
            });

            if (userData) {
                if (userData.is_email_verified) {
                    if (userData.is_active && userData.status == USERSTATUS.ACTIVE) {
                        const isValid = await bcrypt.compare(req.body.password, userData.password);
                        if (isValid) {
                            // Create token
                            const token = jwt.sign(
                                { user_id: userData._id, email: userData.email },
                                getenv("JWT_SECRET_KEY"),
                                {
                                    expiresIn: "2h",
                                }
                            );
                            userData.last_login = new Date();
                            userData.save();
                            response = Responser.success({ jwt: token, create_at: new Date() });
                        } else {
                            response = Responser.custom("R205");
                        }
                    } else {
                        response = Responser.custom("R204");
                    }
                } else {
                    response = Responser.custom("R203");
                }

            } else {
                response = Responser.custom("R202");
            }
        } catch (error) {
            response = Responser.error(error);
        }
    } else {
        response = Responser.validationfail(validation.errors)
    }

    return res.status(response.statusCode).send(response.data);
}

const verify = async (req, res) => {

    let response;
    let validation = new Validator(req.body, {
        token: 'required'
    });

    if (validation.passes()) {
        const token = req.body.token;
        try {
            const isVerified = jwt.verify(token, getenv("JWT_SECRET_KEY"));
            if (isVerified) {
                const data = jwt.decode(token);
                response = Responser.success({
                    "email": data.email
                });
            } else {
                response = Responser.custom("R401");
            }
        } catch (error) {
            if (error.name == "JsonWebTokenError" || error.name == "TokenExpiredError") {
                response = Responser.custom("R401");
            } else {
                response = Responser.error(error);
            }
        }
    } else {
        response = Responser.validationfail(validation.errors)
    }
    return res.status(response.statusCode).send(response.data);
}
const verifyemail = async (req, res) => {
    const token = req.params.token;
    try {
        const isVerified = jwt.verify(token, getenv("JWT_SECRET_KEY"));
        if (isVerified) {
            const decoded = jwt.decode(token, getenv("JWT_SECRET_KEY"));

            if (decoded.type == "verify_email" && decoded.email) {
                const userData = await model.user.findOne({
                    where: {
                        email: decoded.email
                    },
                });
                userData.is_email_verified = true;
                userData.status = USERSTATUS.ACTIVE;
                userData.email_verified_at = new Date();
                userData.save();
                return res.json({ message: 'Email verification successful.' });
            }
        }
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
}
module.exports = {
    create: create,
    login: login,
    verify: verify,
    verifyemail: verifyemail
}
