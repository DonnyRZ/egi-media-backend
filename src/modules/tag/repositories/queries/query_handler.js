const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const domain = new Domain(new DB(config.get("/postgresqlUrl")));
const listTags = (payload) => domain.listTags(payload);
module.exports = { listTags };
