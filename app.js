/* Dependencies Injection */
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const Responser = require("./app/response/index");

/* Environment variable kickstart */
require("dotenv").config();

/* Configulations - Start */
const dbConfig = require("./config/database.config.js");
/* Configulations - End */

/* Routing Files - Start */
const indexRouter = require("./routes/index");
const usersRouter = require("./app/routes/users");
const toursRouter = require("./app/routes/tours");
const membersRouter = require("./app/routes/members");
const accountsRouter = require("./app/routes/accounts");
/* Routing Files - End */

/* Middleware Files - Start */
const authenticate = require("./app/middlewares/authentication.js");
/* Middleware Files - End */

/* Server initiation */
let app = express();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const warmupSqlConnection = async () => {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await dbConfig.mysql.authenticate();
      console.log("SQL connected Successfully!");
      return;
    } catch (error) {
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
const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
/* cors */

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(dbConfig.mongo.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongodb connected Successfully!");
  })
  .catch((err) => {
    console.log("Could not connect to the Mongodb. Exiting now...", err);
    process.exit();
  });

app.use(async (req, res, next) => {
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
app.get("/verify-login", (req, res) => {
  return res.status(200).send(Responser.success().data);
});
app.use("/tours", toursRouter);
app.use("/members", membersRouter);
app.use("/accounts", accountsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let response = Responser.error();
  return res.status(response.statusCode).send(response.data);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
