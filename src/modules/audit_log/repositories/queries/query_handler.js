const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const listAuditLogs = (payload) => domain.listAuditLogs(payload);
const getAuditLog = (payload) => domain.getAuditLog(payload);

module.exports = {
  listAuditLogs,
  getAuditLog,
};
