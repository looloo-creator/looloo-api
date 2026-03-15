import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Validator from "validatorjs";
import { Kafka, Producer } from "kafkajs";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getenv } from "../Utils/common";
import { USERSTATUS } from "../../config/custom.config";
import Responser from "../response";
import models from "../models";

type AuthRequest = Request & { user?: { id: string }; body: any; cookies: any };

class UserController {
  private kafkaDisabled = getenv("KAFKA_DISABLED") === "true";
  private producer?: Producer;
  private producerConnected = false;

  constructor() {
    if (!this.kafkaDisabled) {
      const kafka = new Kafka({
        clientId: getenv("KAFKA_CLIENT_ID") || "looloo-api",
        brokers: (getenv("KAFKA_BROKERS") || "localhost:9092")
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
      });
      this.producer = kafka.producer();
    }
  }

  private async publishVerificationEmailEvent(email: string) {
    if (this.kafkaDisabled || !this.producer) return;
    if (!this.producerConnected) {
      await this.producer.connect();
      this.producerConnected = true;
    }
    await this.producer.send({
      topic: getenv("KAFKA_TOPIC_SEND_VERIFICATION") || "send-verification-link",
      messages: [{ value: JSON.stringify({ email }) }],
    });
  }

  private async verifyGoogleIdToken(idToken: string, audience: string) {
    const googleJwks = createRemoteJWKSet(
      new URL("https://www.googleapis.com/oauth2/v3/certs")
    );
    const { payload } = await jwtVerify(idToken, googleJwks, {
      audience,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });
    return payload;
  }

  private async verifyMicrosoftIdToken(
    idToken: string,
    tenantId: string,
    audience: string
  ) {
    const metadataRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`
    );
    const metadata = await metadataRes.json();
    const jwksUri = metadata.jwks_uri;
    const msJwks = createRemoteJWKSet(new URL(jwksUri));
    const verifyOptions: any = { audience };
    if (
      tenantId !== "common" &&
      tenantId !== "consumers" &&
      tenantId !== "organizations"
    ) {
      verifyOptions.issuer = metadata.issuer;
    }
    const { payload } = await jwtVerify(idToken, msJwks, verifyOptions);
    return payload;
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  async create(req: AuthRequest, res: Response): Promise<Response> {
    const validation = new Validator(req.body, {
      email: "required|email",
      password: "required|min:6",
    });
    if (!validation.passes()) {
      return res
        .status(400)
        .send(Responser.validationfail(validation.errors).data);
    }
    try {
      const hashed = await bcrypt.hash(req.body.password, 10);
      const token = jwt.sign(
        { email: req.body.email, type: "verify_email" },
        getenv("JWT_SECRET_KEY"),
        { expiresIn: "2d" }
      );
      const userData = {
        email: req.body.email,
        password: hashed,
        email_token: token,
      };
      const existing = await models.user.findOne({
        where: { [Op.or]: { email: req.body.email } },
      });
      if (existing) {
        const response = existing.is_email_verified
          ? Responser.custom("R206")
          : Responser.custom("R207");
        return res.status(200).send(response.data);
      }
      await models.user.create(userData);
      await this.publishVerificationEmailEvent(req.body.email);
      return res.status(200).send(Responser.custom("R201").data);
    } catch (error) {
      return res.status(500).send(Responser.error(error).data);
    }
  }

  async login(req: AuthRequest, res: Response): Promise<Response> {
    const validation = new Validator(req.body, {
      email: "required|email",
      password: "required|string",
    });
    if (!validation.passes()) {
      return res
        .status(400)
        .send(Responser.validationfail(validation.errors).data);
    }
    try {
      const userData = await models.user.findOne({
        where: { email: req.body.email },
      });
      if (!userData) return res.status(200).send(Responser.custom("R202").data);
      if (!userData.is_email_verified)
        return res.status(200).send(Responser.custom("R203").data);
      if (!userData.is_active || userData.status !== USERSTATUS.ACTIVE)
        return res.status(200).send(Responser.custom("R204").data);

      const isValid = await bcrypt.compare(req.body.password, userData.password);
      if (!isValid) return res.status(200).send(Responser.custom("R205").data);

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
      userData.refresh_token = refreshToken;
      userData.last_login = new Date();
      await userData.save();
      this.setRefreshCookie(res, refreshToken);
      return res
        .status(200)
        .send(Responser.success({ jwt: accessToken, created_at: new Date() }).data);
    } catch (error) {
      return res.status(500).send(Responser.error(error).data);
    }
  }

  async refresh(req: AuthRequest, res: Response): Promise<Response> {
    const rawToken = req.cookies?.refreshToken;
    const token = typeof rawToken === "string" ? rawToken : undefined;
    if (!token) return res.status(403).send(Responser.error("R403").data);
    try {
      const decoded: any = jwt.verify(token, getenv("JWT_REFRESH_SECRET_KEY"));
      const userData = await models.user.findOne({ where: { id: decoded.user_id } });
      if (!userData || userData.refresh_token !== token)
        return res.status(402).send(Responser.error("R402").data);

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
      this.setRefreshCookie(res, newRefreshToken);
      return res.status(200).send(Responser.success({ jwt: newAccessToken }).data);
    } catch (error) {
      return res
        .status(403)
        .send(Responser.error("Invalid refresh token").data);
    }
  }

  async socialLogin(req: AuthRequest, res: Response): Promise<Response> {
    const msTenantId = getenv("MS_TENANT_ID");
    const msClientId = getenv("MS_CLIENT_ID");
    const { provider, idToken, email } = req.body;
    if (!provider || !idToken) {
      const missing = [];
      if (!provider) missing.push("provider");
      if (!idToken) missing.push("idToken");
      return res.status(400).send({
        success: false,
        statusCode: 400,
        message: `Missing required field(s): ${missing.join(", ")}`,
        data: {},
      });
    }
    try {
      const googleClientId = getenv("GOOGLE_CLIENT_ID");
      const jwtSecret = getenv("JWT_SECRET_KEY");
      const jwtRefreshSecret = getenv("JWT_REFRESH_SECRET_KEY");
      const accessExpiry = getenv("ACCESS_TOKEN_EXPIRY");
      const refreshExpiry = getenv("REFRESH_TOKEN_EXPIRY");

      let verifiedEmail = email as string | undefined;
      let payload: any = null;

      if (provider === "google") {
        if (!googleClientId) {
          return res
            .status(500)
            .send(Responser.error("Missing GOOGLE_CLIENT_ID").data);
        }
        payload = await this.verifyGoogleIdToken(idToken, googleClientId);
        verifiedEmail = verifiedEmail || payload.email;
      } else if (provider === "microsoft") {
        if (!msTenantId || !msClientId) {
          return res
            .status(500)
            .send(
              Responser.error("Missing MS_TENANT_ID or MS_CLIENT_ID").data
            );
        }
        payload = await this.verifyMicrosoftIdToken(idToken, msTenantId, msClientId);
        verifiedEmail =
          verifiedEmail || payload.email || payload.preferred_username;
      } else {
        return res
          .status(400)
          .send(Responser.error("Unsupported provider").data);
      }

      if (!verifiedEmail) {
        return res.status(400).send({
          success: false,
          statusCode: 400,
          message: "Email not present in token",
          data: {},
        });
      }

      let userData = await models.user.findOne({ where: { email: verifiedEmail } });
      const now = new Date();
      const displayName =
        payload?.name ||
        (payload?.given_name && payload?.family_name
          ? `${payload.given_name} ${payload.family_name}`
          : null);

      if (!userData) {
        userData = await models.user.create({
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

      this.setRefreshCookie(res, refreshToken);
      return res.status(200).send(
        Responser.success({
          jwt: accessToken,
          created_at: new Date(),
          provider,
        }).data
      );
    } catch (error: any) {
      return res.status(500).send({
        success: false,
        statusCode: 500,
        message: error?.message || "Social login failed",
        data: {},
      });
    }
  }

  async verifyemail(req: Request, res: Response): Promise<Response> {
    const tokenParam = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;
    const token = tokenParam || "";
    try {
      const isVerified = jwt.verify(token, getenv("JWT_SECRET_KEY"));
      if (isVerified) {
        const decoded: any = jwt.decode(token);
        if (decoded?.type === "verify_email" && decoded.email) {
          const userData = await models.user.findOne({
            where: { email: decoded.email },
          });
          if (userData) {
            userData.is_email_verified = true;
            userData.status = USERSTATUS.ACTIVE;
            userData.email_verified_at = new Date();
            await userData.save();
            return res.json({
              success: true,
              message: "Email verification successful.",
            });
          }
        }
      }
      return res.status(500).json({ message: "Email verification Failed." });
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  async sendLink(req: Request, res: Response): Promise<Response> {
    const validation = new Validator(req.body, { email: "required|email" });
    if (!validation.passes()) {
      return res
        .status(400)
        .send(Responser.validationfail(validation.errors).data);
    }
    try {
      await this.publishVerificationEmailEvent(req.body.email);
      return res
        .status(200)
        .json({ success: true, message: "Verification event published." });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to publish verification event.",
      });
    }
  }
}

export const userController = new UserController();
export default userController;
