const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const listSeries = (payload) => domain.listSeries(payload);
const getSeries = (payload) => domain.getSeries(payload);

module.exports = {
  listSeries,
  getSeries,
};
