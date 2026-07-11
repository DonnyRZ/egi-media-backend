// this file is used to log the data in the console, you can use it to log the data in the console
const winston = require("winston");
const ecsFormat = require("@elastic/ecs-winston-format");
const config = require("../../config/global_config");

const logger = winston.createLogger({
  level: config.get("/env") !== "production" ? "debug" : "http",
  format: winston.format.combine(ecsFormat({ convertReqRes: true }), winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

const enableLogging = () => {
  logger.silent = false;
};

const error = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.error(logObject);
};

const warn = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.warn(logObject);
};

const info = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.info(logObject);
};

const debug = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.debug(logObject);
};

const log = (context, message, scope, data) => {
  const logObject = { context, message, scope, data };
  logger.debug(logObject);
};

module.exports = {
  enableLogging,
  error,
  warn,
  info,
  debug,
  log,
};
