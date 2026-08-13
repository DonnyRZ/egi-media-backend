const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addAd = (payload) => domain.addAd(payload);
const updateAd = (payload) => domain.updateAd(payload);
const deleteAd = (payload) => domain.deleteAd(payload);
const trackClick = (payload) => domain.trackClick(payload);
const trackImpression = (payload) => domain.trackImpression(payload);

module.exports = {
  addAd,
  updateAd,
  deleteAd,
  trackClick,
  trackImpression,
};
