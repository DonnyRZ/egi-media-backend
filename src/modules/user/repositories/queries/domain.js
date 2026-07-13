const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "User-Query-Domain";

class UserQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  // ─── List Users dengan pagination ──────────────────────────────────────────
  async getUsers(payload) {
    const { page, limit, search, role } = payload;

    const [usersResult, countResult] = await Promise.all([
      this.query.findAllUsers({ page, limit, search, role }),
      this.query.countAllUsers({ search, role }),
    ]);

    if (usersResult.err) {
      logger.error(ctx, "getUsers", "Failed to fetch users", usersResult.err);
      return wrapper.error(usersResult.err);
    }

    if (countResult.err) {
      logger.error(ctx, "getUsers", "Failed to count users", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const total_pages = Math.ceil(total / limit);

    logger.info(ctx, "getUsers", "Fetched users successfully", { total });

    return wrapper.data({
      items: usersResult.data,
      meta: {
        total,
        page,
        limit,
        total_pages,
      },
    });
  }

  // ─── Get Detail User By ID ──────────────────────────────────────────────────
  async getUserById(payload) {
    const { id } = payload;

    const userResult = await this.query.findUserById(id);

    if (userResult.err) {
      logger.error(ctx, "getUserById", "User not found", { id });
      return wrapper.error(new NotFoundError("User not found"));
    }

    const row = userResult.data;

    // Mapping User + profile object
    const user = {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      login_provider: row.login_provider,
      email_verified_at: row.email_verified_at,
      last_login_at: row.last_login_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      profile: {
        user_id: row.id,
        avatar_url: row.avatar_url || null,
        bio: row.bio || null,
        industry: row.industry || null,
        job_title: row.job_title || null,
        seniority: row.seniority || null,
        company: row.company || null,
        country: row.country || null,
        created_at: row.profile_created_at || null,
        updated_at: row.profile_updated_at || null,
      },
    };

    logger.info(ctx, "getUserById", "Fetched user successfully", { id });
    return wrapper.data(user);
  }

  // ─── Get Followers ──────────────────────────────────────────────────────────
  async getFollowers(payload) {
    const { id: author_id, page, limit } = payload;

    // Pastikan author ada
    const authorExists = await this.query.findUserExistsById(author_id);
    if (authorExists.err) {
      logger.error(ctx, "getFollowers", "Author not found", { author_id });
      return wrapper.error(new NotFoundError("User not found"));
    }

    const [followersResult, countResult] = await Promise.all([
      this.query.findFollowers({ author_id, page, limit }),
      this.query.countFollowers(author_id),
    ]);

    if (followersResult.err) {
      logger.error(ctx, "getFollowers", "Failed to fetch followers", followersResult.err);
      return wrapper.error(followersResult.err);
    }

    if (countResult.err) {
      logger.error(ctx, "getFollowers", "Failed to count followers", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const total_pages = Math.ceil(total / limit);

    logger.info(ctx, "getFollowers", "Fetched followers successfully", { author_id, total });

    return wrapper.data({
      items: followersResult.data,
      meta: {
        total,
        page,
        limit,
        total_pages,
      },
    });
  }
}

module.exports = UserQueryDomain;
