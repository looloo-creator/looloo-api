const model = require("../models/index");
const { Op } = require("sequelize");
const Responser = require("../response/index");
let Validator = require("validatorjs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getenv } = require("../Utils/common");
const { USERSTATUS } = require("../../config/custom.config");
const { Kafka } = require("kafkajs");
const { createRemoteJWKSet, jwtVerify } = require("jose");
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const kafka = new Kafka({
  clientId: getenv("KAFKA_CLIENT_ID") || "looloo-api",
  brokers: (getenv("KAFKA_BROKERS") || "localhost:9092")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean),
});
const producer = kafka.producer();
let producerConnected = false;

const publishVerificationEmailEvent = async (email) => {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
  }

  await producer.send({
    topic: getenv("KAFKA_TOPIC_SEND_VERIFICATION") || "send-verification-link",
    messages: [{ value: JSON.stringify({ email }) }],
  });
};

// ----- Social token verification helpers -----
const verifyGoogleIdToken = async (idToken, audience) => {
  const googleJwks = createRemoteJWKSet(
    new URL('https://www.googleapis.com/oauth2/v3/certs'),
  );
  const { payload } = await jwtVerify(idToken, googleJwks, {
    audience,
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
  });
  return payload;
};

const verifyMicrosoftIdToken = async (idToken, tenantId, audience) => {
  const metadataRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`,
  );
  const metadata = await metadataRes.json();
  const jwksUri = metadata.jwks_uri;
  const msJwks = createRemoteJWKSet(new URL(jwksUri));
  const verifyOptions = { audience };
  // For multi-tenant (common/consumers/organizations), the issuer in the token is tenant-specific.
  // Skip strict issuer check to allow personal accounts (tid changes per user).
  if (tenantId !== 'common' && tenantId !== 'consumers' && tenantId !== 'organizations') {
    verifyOptions.issuer = metadata.issuer;
  }
  const { payload } = await jwtVerify(idToken, msJwks, verifyOptions);
  return payload;
};

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

        await publishVerificationEmailEvent(req.body.email);
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "Strict" : "Lax",
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "Strict" : "Lax",
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

// ============ SOCIAL LOGIN (Placeholder) ==============
const socialLogin = async (req, res) => {
  const msTenantId = getenv("MS_TENANT_ID");
  const msClientId = getenv("MS_CLIENT_ID");
  const { provider, idToken, email } = req.body;

  if (!provider || !idToken) {
    const missing = [];
    if (!provider) missing.push('provider');
    if (!idToken) missing.push('idToken');
    return res.status(400).send({
      success: false,
      statusCode: 400,
      message: `Missing required field(s): ${missing.join(', ')}`,
      data: {},
    });
  }

  // Verify provider token
  try {
    const googleClientId = getenv("GOOGLE_CLIENT_ID");
    const jwtSecret = getenv("JWT_SECRET_KEY");
    const jwtRefreshSecret = getenv("JWT_REFRESH_SECRET_KEY");
    const accessExpiry = getenv("ACCESS_TOKEN_EXPIRY");
    const refreshExpiry = getenv("REFRESH_TOKEN_EXPIRY");

    let verifiedEmail = email;
    let payload = null;

    if (provider === 'google') {
      if (!googleClientId) {
        return res.status(500).send(Responser.error("Missing GOOGLE_CLIENT_ID").data);
      }
      payload = await verifyGoogleIdToken(idToken, googleClientId);
      if (!verifiedEmail) verifiedEmail = payload.email;
    } else if (provider === 'microsoft') {
      if (!msTenantId || !msClientId) {
        return res.status(500).send(Responser.error("Missing MS_TENANT_ID or MS_CLIENT_ID").data);
      }
      payload = await verifyMicrosoftIdToken(idToken, msTenantId, msClientId);
      if (!verifiedEmail) verifiedEmail = payload.email || payload.preferred_username;
    } else {
      return res.status(400).send(Responser.error("Unsupported provider").data);
    }

    if (!verifiedEmail) {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        message: "Email not present in token",
        data: {},
      });
    }

    let userData = await model.user.findOne({ where: { email: verifiedEmail } });

    const now = new Date();
    const displayName =
      payload?.name ||
      (payload?.given_name && payload?.family_name
        ? `${payload.given_name} ${payload.family_name}`
        : null);

    if (!userData) {
      userData = await model.user.create({
        email: verifiedEmail,
        username: displayName,
        password: null,
        is_email_verified: 1,
        status: USERSTATUS.ACTIVE,
        is_active: 1,
        email_verified_at: now,
        last_login: now,
      });
    } else {
      userData.username = userData.username || displayName;
      userData.is_email_verified = 1;
      userData.status = USERSTATUS.ACTIVE;
      userData.is_active = 1;
      if (!userData.email_verified_at) {
        userData.email_verified_at = now;
      }
      userData.last_login = now;
    }

    const accessToken = jwt.sign(
      { user_id: userData.id, email: userData.email },
      jwtSecret,
      { expiresIn: accessExpiry }
    );

    const refreshToken = jwt.sign(
      { user_id: userData.id, email: userData.email },
      jwtRefreshSecret,
      { expiresIn: refreshExpiry }
    );

    userData.refresh_token = refreshToken;
    userData.last_login = new Date();
    await userData.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "Strict" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).send(
      Responser.success({
        jwt: accessToken,
        created_at: new Date(),
        provider,
      }).data
    );
  } catch (error) {
    console.error('socialLogin error', error);
    return res.status(500).send({
      success: false,
      statusCode: 500,
      message: error?.message || 'Social login failed',
      data: {},
    });
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

  try {
    await publishVerificationEmailEvent(req.body.email);
    return res.status(200).json({
      success: true,
      message: "Verification event published.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish verification event.",
    });
  }
};
module.exports = {
  create: create,
  login: login,
  refresh: refreshToken,
  verifyemail: verifyemail,
  sendLink: sendLink,
  socialLogin: socialLogin,
};
