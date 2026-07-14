const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const hashHelper = require("../../../../helpers/utils/hash_helper");
const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require("../../../../helpers/errors");
const ctx = "User-Command-Domain";

class UserCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  // ─── Update User ────────────────────────────────────────────────────────────
  async updateUser(payload) {
    const { id, full_name, role } = payload;

    // Pastikan setidaknya ada satu field yang diupdate
    if (full_name === undefined && role === undefined) {
      return wrapper.error(new BadRequestError("At least one field (full_name or role) must be provided"));
    }

    // Cek user exist
    const userExists = await this.query.findUserExistsById(id);
    if (userExists.err) {
      logger.error(ctx, "updateUser", "User not found", { id });
      return wrapper.error(new NotFoundError("User not found"));
    }

    const result = await this.command.updateUser({ id, full_name, role });
    if (result.err) {
      logger.error(ctx, "updateUser", "Failed to update user", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "updateUser", "User updated successfully", { id });
    return wrapper.data(result.data);
  }

  // ─── Soft Delete User ───────────────────────────────────────────────────────
  async deleteUser(payload) {
    const { id } = payload;

    // Cek user exist
    const userExists = await this.query.findUserExistsById(id);
    if (userExists.err) {
      logger.error(ctx, "deleteUser", "User not found", { id });
      return wrapper.error(new NotFoundError("User not found"));
    }

    const result = await this.command.softDeleteUser(id);
    if (result.err) {
      logger.error(ctx, "deleteUser", "Failed to delete user", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "deleteUser", "User soft deleted successfully", { id });
    return wrapper.data(true);
  }

  // ─── Follow Author ──────────────────────────────────────────────────────────
  async followAuthor(payload) {
    const { id: author_id, follower_id } = payload;

    // Tidak boleh follow diri sendiri
    if (author_id === follower_id) {
      return wrapper.error(new BadRequestError("You cannot follow yourself"));
    }

    // Cek author exist
    const authorExists = await this.query.findUserExistsById(author_id);
    if (authorExists.err) {
      logger.error(ctx, "followAuthor", "Author not found", { author_id });
      return wrapper.error(new NotFoundError("User not found"));
    }

    // Cek apakah sudah follow
    const followRecord = await this.query.findFollowRecord(author_id, follower_id);
    if (!followRecord.err) {
      return wrapper.error(new ConflictError("Already following this author"));
    }

    const result = await this.command.insertFollow({ author_id, follower_id });
    if (result.err) {
      logger.error(ctx, "followAuthor", "Failed to follow author", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "followAuthor", "Followed author successfully", { author_id, follower_id });
    return wrapper.data(true);
  }

  // ─── Unfollow Author ────────────────────────────────────────────────────────
  async unfollowAuthor(payload) {
    const { id: author_id, follower_id } = payload;

    // Cek author exist
    const authorExists = await this.query.findUserExistsById(author_id);
    if (authorExists.err) {
      logger.error(ctx, "unfollowAuthor", "Author not found", { author_id });
      return wrapper.error(new NotFoundError("User not found"));
    }

    // Cek apakah follow record ada
    const followRecord = await this.query.findFollowRecord(author_id, follower_id);
    if (followRecord.err) {
      return wrapper.error(new NotFoundError("You are not following this author"));
    }

    const result = await this.command.deleteFollow({ author_id, follower_id });
    if (result.err) {
      logger.error(ctx, "unfollowAuthor", "Failed to unfollow author", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "unfollowAuthor", "Unfollowed author successfully", { author_id, follower_id });
    return wrapper.data(true);
  }

  // ─── Add Author (superadmin only) ───────────────────────────────────────────
  async addAuthor(payload) {
    const { email, password, full_name } = payload;

    // Cek apakah email sudah terdaftar
    const existingUser = await this.query.findUserByEmail(email);
    if (!existingUser.err) {
      return wrapper.error(new ConflictError("Email already registered"));
    }

    const passwordHash = await hashHelper.generateHash(password);
    const now = new Date();
    const userId = uuidv4();

    const result = await this.command.insertUser({
      id: userId,
      email,
      password_hash: passwordHash,
      full_name,
      role: "author",
      login_provider: "email",
      email_verified_at: now,
      last_login_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    if (result.err) {
      logger.error(ctx, "addAuthor", "Failed to insert author", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "addAuthor", "Author created successfully", { userId, email });
    return wrapper.data(result.data);
  }
}

module.exports = UserCommandDomain;
