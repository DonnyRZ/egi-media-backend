const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

class AdQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  mapItem(row) {
    return {
      id: row.id,
      title: row.title,
      image_url: row.image_url,
      target_url: row.target_url,
      placement: row.placement,
      is_active: row.is_active !== false,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      image_width: row.image_width ?? null,
      image_height: row.image_height ?? null,
      image_receipt: row.image_receipt ?? null,
    };
  }

  mapPublicItem(row) {
    return {
      id: row.id,
      title: row.title,
      image_url: row.image_url,
      target_url: row.target_url,
      placement: row.placement,
      image_width: row.image_width ?? null,
      image_height: row.image_height ?? null,
    };
  }

  async listAds(payload) {
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(
        new InternalServerError("Unable to retrieve advertisements")
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

  async getAd({ id }) {
    const result = await this.query.findOneById(id);
    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to retrieve advertisement")
      );
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Advertisement not found"));
    }
    return wrapper.data(this.mapItem(result.rows[0]));
  }

  async listActiveByPlacement({ placement }) {
    const result = await this.query.findActiveByPlacement(placement);
    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to retrieve active advertisements")
      );
    }
    return wrapper.data(result.rows.map((row) => this.mapPublicItem(row)));
  }
}

module.exports = AdQueryDomain;
