const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const listAds = (payload) => domain.listAds(payload);
const getAd = (payload) => domain.getAd(payload);
const listActiveByPlacement = (payload) =>
  domain.listActiveByPlacement(payload);

module.exports = {
  listAds,
  getAd,
  listActiveByPlacement,
};
