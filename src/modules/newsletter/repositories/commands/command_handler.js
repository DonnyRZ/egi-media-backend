const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createNewsletter = (payload) => domain.createNewsletter(payload);
const updateNewsletter = (payload) => domain.updateNewsletter(payload);
const deleteNewsletter = (payload) => domain.deleteNewsletter(payload);
const addArticleToNewsletter = (payload) => domain.addArticleToNewsletter(payload);
const removeArticleFromNewsletter = (payload) => domain.removeArticleFromNewsletter(payload);
const subscribeToNewsletter = (payload) => domain.subscribeToNewsletter(payload);
const unsubscribeFromNewsletter = (payload) => domain.unsubscribeFromNewsletter(payload);

module.exports = {
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  addArticleToNewsletter,
  removeArticleFromNewsletter,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
};
