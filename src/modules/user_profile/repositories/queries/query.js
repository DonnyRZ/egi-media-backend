const collection = "user_profiles";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "UserProfile-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection, conditions = "AND") {
    return this.db.findOne(parameter, projection, collection, conditions);
  }
}

module.exports = Query;
