const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const ctx = "UserProfile-Query-Domain";

class UserProfile {
  constructor(db) {
    this.query = new Query(db);
  }

  async getUserProfile(payload) {
    const { user_id } = payload;
    const projection = {
      user_id: 1,
      avatar_url: 1,
      bio: 1,
      industry: 1,
      job_title: 1,
      seniority: 1,
      company: 1,
      country: 1,
      created_at: 1,
      updated_at: 1,
    };
    const profile = await this.query.findOne({ user_id }, projection);
    if (profile.err) {
      logger.info(ctx, "getUserProfile", "Profile not found, returning default empty profile", { user_id });
      return wrapper.data({
        user_id,
        avatar_url: null,
        bio: null,
        industry: null,
        job_title: null,
        seniority: null,
        company: null,
        country: null,
        created_at: null,
        updated_at: null,
      });
    }

    logger.info(ctx, "getUserProfile", "get detail user profile success", payload);
    return wrapper.data(profile.data);
  }
}

module.exports = UserProfile;
