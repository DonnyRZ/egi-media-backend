const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const domain = new Domain(new DB(config.get("/postgresqlUrl")));
const createTag = (payload) => domain.createTag(payload);
const updateTag = (payload) => domain.updateTag(payload);
const deleteTag = (payload) => domain.deleteTag(payload);
module.exports = { createTag, updateTag, deleteTag };
