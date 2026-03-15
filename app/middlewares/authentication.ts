import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getenv } from "../Utils/common";
import Responser from "../response";
import models from "../models";
import { USERSTATUS } from "../../config/custom.config";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; name?: string };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    const response = Responser.custom("R401");
    return res.status(response.statusCode).send(response.data);
  }

  jwt.verify(
    token,
    getenv("JWT_SECRET_KEY", "secret"),
    async (err: any, decoded: any) => {
      if (err || !decoded) {
        const response = Responser.custom("R401");
        return res.status(response.statusCode).send(response.data);
      }
      const userId = decoded.user_id || decoded.id;
      const user = await models.user.findOne({ where: { id: userId } });
      if (!user || user.status !== USERSTATUS.ACTIVE) {
        const response = Responser.custom("R401");
        return res.status(response.statusCode).send(response.data);
      }
      req.user = { id: user.id, email: user.email, name: user.name };
      return next();
    }
  );
};

export default authenticate;
