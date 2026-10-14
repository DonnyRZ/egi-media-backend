const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const listCategories = (payload) => domain.listCategories(payload);
const getCategory = (payload) => domain.getCategory(payload);
const getCategoryTranslationState = (payload) => domain.getCategoryTranslationState(payload);

module.exports = {
  listCategories,
  getCategory,
  getCategoryTranslationState,
};
