const collection = "users";
const tokenCollection = "password_reset_tokens";

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertUser(document) {
    return this.db.insertOne(document, collection);
  }

  async updateUser(parameter, document) {
    return this.db.updateOneNew(parameter, document, collection);
  }

  async insertToken(document) {
    return this.db.insertOne(document, tokenCollection);
  }

  async markTokenUsed(parameter, document) {
    return this.db.updateOneNew(parameter, document, tokenCollection);
  }
}

module.exports = Command;
