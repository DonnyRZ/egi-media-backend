const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createArticle = async (payload) => domain.createArticle(payload);
const updateArticle = async (payload) => domain.updateArticle(payload);
const deleteArticle = async (payload) => domain.deleteArticle(payload);
const changeStatus = async (payload) => domain.changeStatus(payload);
const saveArticle = async (payload) => domain.saveArticle(payload);
const unsaveArticle = async (payload) => domain.unsaveArticle(payload);
const shareArticle = async (payload) => domain.shareArticle(payload);

module.exports = {
  createArticle,
  updateArticle,
  deleteArticle,
  changeStatus,
  saveArticle,
  unsaveArticle,
  shareArticle,
};
