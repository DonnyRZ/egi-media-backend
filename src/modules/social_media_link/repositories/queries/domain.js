const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

class SocialMediaLinkQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  mapItem(row) {
    return {
      id: row.id,
      platform_name: row.platform_name,
      url: row.url,
      icon_name: row.icon_name,
      is_active: row.is_active !== false,
      sort_order: row.sort_order ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async listSocialMediaLinks(payload) {
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(
        new InternalServerError("Unable to retrieve social media links")
      );
    }

    const total = count.rows[0]?.total || 0;
    const items = rows.rows.map((row) => this.mapItem(row));

    return wrapper.paginationData(items, {
      page: payload.page,
      limit: payload.limit,
      total,
      total_pages: Math.ceil(total / payload.limit) || 0,
    });
  }

  async getSocialMediaLink({ id }) {
    const result = await this.query.findOneById(id);
    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to retrieve social media link")
      );
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Social media link not found"));
    }
    return wrapper.data(this.mapItem(result.rows[0]));
  }
}

module.exports = SocialMediaLinkQueryDomain;
