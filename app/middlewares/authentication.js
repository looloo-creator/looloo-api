const jwt = require("jsonwebtoken");
const { getenv } = require("../Utils/common");
const Responser = require("../response");
const model = require("../models/index");
const { USERSTATUS } = require("../../config/custom.config");

const authenticate = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  let token = req.headers.authorization;
  if (!token) {
    return res.status(401).send(Responser.error("R401").data);
  }

  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).send(Responser.error("R403").data);

  token = token.replace("Bearer ", "");
  jwt.verify(token, getenv("JWT_SECRET_KEY"), async (err, decoded) => {
    if (err) {
      return res.status(401).send(Responser.error("R401").data);
    } else if (decoded.email) {
      const userData = await model.user.findOne({
        where: {
          email: decoded.email,
        },
      });
      if (
        userData &&
        userData.is_email_verified &&
        userData.status == USERSTATUS.ACTIVE &&
        userData.is_active
      ) {
        if (userData.refresh_token !== refreshToken)
          return res.status(402).send(Responser.error("R402").data);
        req.user = userData;
        next();
      } else {
        return res.status(401).send(Responser.error("R401").data);
      }
    } else {
      return res.status(401).send(Responser.error("R401").data);
    }
  });
};
module.exports = authenticate;
