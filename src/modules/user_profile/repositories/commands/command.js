const collection = "user_profiles";

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertOne(document) {
    return this.db.insertOne(document, collection);
  }

  async updateOneNew(parameter, document) {
    return this.db.updateOneNew(parameter, document, collection);
  }
}

module.exports = Command;
