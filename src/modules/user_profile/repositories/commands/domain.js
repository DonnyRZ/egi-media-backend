const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const ctx = "UserProfile-Command-Domain";

class UserProfile {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async updateUserProfile(payload) {
    const { user_id, ...updateFields } = payload;
    
    const profile = await this.query.findOne({ user_id }, { user_id: 1 });
    
    let result;
    const now = new Date();
    if (profile.err) {
      logger.info(ctx, "updateUserProfile", "Profile not found, performing INSERT", { user_id });
      result = await this.command.insertOne({
        user_id,
        ...updateFields,
        created_at: now,
        updated_at: now,
      });
    } else {
      logger.info(ctx, "updateUserProfile", "Profile exists, performing UPDATE", { user_id });
      result = await this.command.updateOneNew(
        { user_id },
        {
          ...updateFields,
          updated_at: now,
        }
      );
    }

    if (result.err) {
      logger.error(ctx, "updateUserProfile", "Failed to update profile", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "updateUserProfile", "Profile successfully updated", { user_id });
    return wrapper.data(result.data);
  }
}

module.exports = UserProfile;
