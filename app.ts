import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import mongoose from "mongoose";
import cors from "cors";
import Responser from "./app/response";

/* Environment variable kickstart */
require("dotenv").config();

import dbConfig from "./config/database.config";

import indexRouter from "./routes/index";
import usersRouter from "./app/routes/users";
import toursRouter from "./app/routes/tours";
import membersRouter from "./app/routes/members";
import accountsRouter from "./app/routes/accounts";

import authenticate from "./app/middlewares/authentication";

/* Server initiation */
const app = express();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const warmupSqlConnection = async () => {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await dbConfig.mysql.authenticate();
      console.log("SQL connected Successfully!");
      return;
    } catch (error: any) {
      const isLast = attempt === maxAttempts;
      console.error(
        `SQL warm-up attempt ${attempt}/${maxAttempts} failed: ${error.message}`
      );
      if (isLast) {
        throw error;
      }
      await delay(5000);
    }
  }
};

const dbWarmupPromise = warmupSqlConnection();
let isDbReady = false;

dbWarmupPromise
  .then(() => {
    isDbReady = true;
  })
  .catch(() => {
    isDbReady = false;
  });

/* view engine setup */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(logger("dev"));

/* cors */
const ALLOWED_ORIGIN = "http://localhost:4200";
const corsOptions = {
  origin: ALLOWED_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};
// Force explicit headers for credentialed requests and short-circuit OPTIONS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});
app.use(cors(corsOptions));
/* cors */

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(dbConfig.mongo.url)
  .then(() => {
    console.log("Mongodb connected Successfully!");
  })
  .catch((err) => {
    console.log("Could not connect to the Mongodb. Exiting now...", err);
    process.exit();
  });

app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (isDbReady) {
    return next();
  }

  try {
    await dbWarmupPromise;
    isDbReady = true;
    return next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database is waking up. Please retry shortly.",
    });
  }
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use(authenticate);
app.get("/verify-login", (req: Request, res: Response) => {
  return res.status(200).send(Responser.success().data);
});
app.use("/tours", toursRouter);
app.use("/members", membersRouter);
app.use("/accounts", accountsRouter);

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response) {
  const response = Responser.error();
  return res.status(response.statusCode).send(response.data);
});

// error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
