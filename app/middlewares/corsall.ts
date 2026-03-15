import { Request, Response, NextFunction } from "express";

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS =
  "Origin, X-Requested-With, Content-Type, Accept, Authorization";

const selectOrigin = (
  origin: string | undefined,
  allowedOrigins: readonly string[],
  allowedSuffixes: readonly string[]
) => {
  if (
    origin &&
    (allowedOrigins.includes(origin) ||
      allowedSuffixes.some((suffix) => origin.endsWith(suffix)))
  ) {
    return origin;
  }
  return allowedOrigins[0];
};

export const corsAll =
  (allowedOrigins: readonly string[], allowedSuffixes: readonly string[] = []) =>
  (req: Request, res: Response, next: NextFunction) => {
    const origin = selectOrigin(req.headers.origin, allowedOrigins, allowedSuffixes);

    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    res.header("Access-Control-Allow-Methods", ALLOWED_METHODS);

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  };

export default corsAll;
