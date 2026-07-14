const cors = require("./cors");
const path = require("path");
const express = require("express");
const routes = require("../routes");
const config = require("../config/global_config");
const cookieParser = require("cookie-parser");
const pgConfig = config.get("/postgresqlUrl");
const pgConnectionPool = require("../helpers/databases/postgresql/connection");
const redisConnection = require("../helpers/databases/redis/connection");
const emailWorker = require("../helpers/queues/email.worker");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

class AppServer {
  constructor() {
    this.server = express();
    this.server.use(cors);
    this.port = config.get("/port");

    this._middlewares();
    this._routes();
    this.server.use(express.urlencoded({ extended: true }));
    // this.server.use("/uploads", express.static("uploads"));
    // this.server.use(
    //   "/uploads",
    //   express.static(path.join(__dirname, "../uploads"))
    // );

    pgConnectionPool.init(pgConfig);
    redisConnection.init();
    emailWorker.start();
  }


  _middlewares() {
    this.server.use(express.json());
    this.server.use(cookieParser());
    this.server.use(passport.initialize());
    // Inisialisasi Google OAuth strategy
    require("../helpers/auth/google_oauth");
  }

  _routes() {
    this.server.get("/", (req, res) => {
      res.status(200).send({
        success: true,
        data: "",
        message: "Success",
        code: 200,
      });
    });

    // Swagger UI
    try {
      const swaggerFile = JSON.parse(fs.readFileSync(path.join(__dirname, "../../swagger_output.json"), 'utf8'));
      this.server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
    } catch (err) {
      console.warn("Swagger file not found. Run 'npm run swagger' to generate it.");
    }

    routes(this.server);
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log("\n", __dirname);
      console.log(`🚀 Server running at http://localhost:${this.port}\n`);
    });
  }
}

module.exports = AppServer;
