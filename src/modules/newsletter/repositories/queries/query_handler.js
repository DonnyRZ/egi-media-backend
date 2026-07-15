const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const listNewsletters = (payload) => domain.listNewsletters(payload);
const getNewsletter = (payload) => domain.getNewsletter(payload);

module.exports = {
  listNewsletters,
  getNewsletter,
};
