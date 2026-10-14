const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createCategory = (payload) => domain.createCategory(payload);
const updateCategory = (payload) => domain.updateCategory(payload);
const deleteCategory = (payload) => domain.deleteCategory(payload);
const retryCategoryTranslation = (payload) => domain.retryCategoryTranslation(payload);

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  retryCategoryTranslation,
};
