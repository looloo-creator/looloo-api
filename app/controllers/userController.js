const model = require("../models/index");
const { Op } = require("sequelize");
const Responser = require("../response/index");
let Validator = require("validatorjs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getenv } = require("../Utils/common");
const { USERSTATUS } = require("../../config/custom.config");
const { default: axios } = require("axios");

const create = async (req, res) => {
  let validation = new Validator(req.body, {
    email: "required|email",
    password: "required|min:6",
  });

  let response;

  if (validation.passes()) {
    try {
      const password = await bcrypt.hash(req.body.password, 10);

      const token = jwt.sign(
        { email: req.body.email, type: "verify_email" },
        getenv("JWT_SECRET_KEY"),
        { expiresIn: "2d" }
      );
      let userData = {
        email: req.body.email,
        password: password,
        email_token: token,
      };
      const checkData = await model.user.findOne({
        where: {
          [Op.or]: {
            email: req.body.email,
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
        await model.user.create(userData).then((result) => {
          delete userData.password;
          response = Responser.custom("R201");
        });

        let data = JSON.stringify({
          email: req.body.email,
        });

        let config = {
          method: "post",
          url: getenv("MAIL_SERVICE_URL") + "/auth/send-verification",
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        };

        axios
          .request(config)
          .then((response) => {})
          .catch((error) => {});
      }
    } catch (error) {
      console.log(error);
      response = Responser.error(error);
    }
  } else {
    response = Responser.validationfail(validation.errors);
  }
  return res.status(response.statusCode).send(response.data);
};

// ============ LOGIN ==============
const login = async (req, res) => {
  let validation = new Validator(req.body, {
    email: "required|email",
    password: "required|string",
  });

  if (!validation.passes()) {
    return res
      .status(400)
      .send(Responser.validationfail(validation.errors).data);
  }

  try {
    const userData = await model.user.findOne({
      where: { email: req.body.email },
    });

    if (!userData) return res.status(200).send(Responser.custom("R202").data); // user not found

    if (!userData.is_email_verified)
      return res.status(200).send(Responser.custom("R203").data);

    if (!userData.is_active || userData.status !== USERSTATUS.ACTIVE)
      return res.status(200).send(Responser.custom("R204").data);

    const isValid = await bcrypt.compare(req.body.password, userData.password);
    if (!isValid) return res.status(200).send(Responser.custom("R205").data);

    // Generate tokens
    const accessToken = jwt.sign(
      { user_id: userData.id, email: userData.email },
      getenv("JWT_SECRET_KEY"),
      { expiresIn: getenv("ACCESS_TOKEN_EXPIRY") }
    );

    const refreshToken = jwt.sign(
      { user_id: userData.id, email: userData.email },
      getenv("JWT_REFRESH_SECRET_KEY"),
      { expiresIn: getenv("REFRESH_TOKEN_EXPIRY") }
    );

    // Store refresh token in DB
    userData.refresh_token = refreshToken;
    userData.last_login = new Date();
    await userData.save();

    // Send refresh token in secure HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).send(
      Responser.success({
        jwt: accessToken,
        created_at: new Date(),
      }).data
    );
  } catch (error) {
    console.error(error);
    return res.status(500).send(Responser.error(error).data);
  }
};

// ============ REFRESH TOKEN ==============
const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(403).send(Responser.error("R403").data);

  try {
    const decoded = jwt.verify(token, getenv("JWT_REFRESH_SECRET_KEY"));
    const userData = await model.user.findOne({
      where: { id: decoded.user_id },
    });

    if (!userData || userData.refresh_token !== token)
      return res.status(402).send(Responser.error("R402").data);

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { user_id: userData.id, email: userData.email },
      getenv("JWT_SECRET_KEY"),
      { expiresIn: getenv("ACCESS_TOKEN_EXPIRY") }
    );

    const newRefreshToken = jwt.sign(
      { user_id: userData.id, email: userData.email },
      getenv("JWT_REFRESH_SECRET_KEY"),
      { expiresIn: getenv("REFRESH_TOKEN_EXPIRY") }
    );

    userData.refresh_token = newRefreshToken;
    await userData.save();

    // Update cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).send(
      Responser.success({
        jwt: newAccessToken,
      }).data
    );
  } catch (error) {
    console.error(error);
    return res.status(403).send(Responser.error("Invalid refresh token").data);
  }
};

const verifyemail = async (req, res) => {
  const token = req.params.token;
  try {
    const isVerified = jwt.verify(token, getenv("JWT_SECRET_KEY"));
    if (isVerified) {
      const decoded = jwt.decode(token, getenv("JWT_SECRET_KEY"));

      if (decoded.type == "verify_email" && decoded.email) {
        const userData = await model.user.findOne({
          where: {
            email: decoded.email,
          },
        });
        userData.is_email_verified = true;
        userData.status = USERSTATUS.ACTIVE;
        userData.email_verified_at = new Date();
        userData.save();
        return res.json({
          success: true,
          message: "Email verification successful.",
        });
      }
    }
    return res.status(500).json({
      message: "Email verification Failed.",
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const sendLink = async (req, res) => {
  let validation = new Validator(req.body, {
    email: "required|email",
  });

  if (!validation.passes()) {
    return res
      .status(400)
      .send(Responser.validationfail(validation.errors).data);
  }

  let data = JSON.stringify({
    email: req.body.email,
  });

  let config = {
    method: "post",
    url: getenv("MAIL_SERVICE_URL") + "/auth/send-verification",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      return res.status(200).json(response);
    })
    .catch((error) => {
      console.log(error);
      return res.status(error.status).json();
    });
};
module.exports = {
  create: create,
  login: login,
  refresh: refreshToken,
  verifyemail: verifyemail,
  sendLink: sendLink,
};
