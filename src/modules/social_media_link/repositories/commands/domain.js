const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

class SocialMediaLinkCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addSocialMediaLink(payload) {
    const now = new Date();
    const result = await this.command.insertOne({
      id: randomUUID(),
      platform_name: payload.platform_name,
      url: payload.url,
      icon_name: payload.icon_name,
      is_active: payload.is_active !== false,
      sort_order: payload.sort_order ?? 0,
      created_at: now,
      updated_at: now,
    });

    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to add social media link")
      );
    }

    return wrapper.data(result.rows[0]);
  }

  async updateSocialMediaLink(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(
        new InternalServerError("Unable to validate social media link")
      );
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Social media link not found"));
    }

    const result = await this.command.updateOne({
      id: payload.id,
      platform_name: payload.platform_name,
      url: payload.url,
      icon_name: payload.icon_name,
      is_active: payload.is_active !== false,
      sort_order: payload.sort_order ?? 0,
      updated_at: new Date(),
    });

    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to update social media link")
      );
    }

    return wrapper.data(result.rows[0]);
  }

  async deleteSocialMediaLink({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(
        new InternalServerError("Unable to validate social media link")
      );
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Social media link not found"));
    }

    const result = await this.command.deleteOne(id);
    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to delete social media link")
      );
    }

    return wrapper.data(result.rows[0]);
  }
}

module.exports = SocialMediaLinkCommandDomain;
