const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getArticles = async (payload) => domain.getArticles(payload);
const getArticleById = async (payload) => domain.getArticleById(payload);
const getArticleBySlug = async (payload) => domain.getArticleBySlug(payload);
const getMyArticles = async (payload) => domain.getMyArticles(payload);
const getSavedArticles = async (payload) => domain.getSavedArticles(payload);

module.exports = {
  getArticles,
  getArticleById,
  getArticleBySlug,
  getMyArticles,
  getSavedArticles,
};
