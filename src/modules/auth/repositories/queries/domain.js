const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Auth-Query-Domain";

class Auth {
  constructor(db) {
    this.query = new Query(db);
  }

  async getMe(payload) {
    const { user_id } = payload;

    const userResult = await this.query.findUserById(user_id);
    if (userResult.err) {
      logger.info(ctx, "getMe", "User not found", { user_id });
      return wrapper.error(new NotFoundError("User not found"));
    }

    const user = userResult.data;

    // Tidak mengembalikan password_hash ke client
    const { password_hash, ...safeUser } = user;

    logger.info(ctx, "getMe", "getMe success", { user_id });
    return wrapper.data(safeUser);
  }
}

module.exports = Auth;
