const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError } = require("../../../../helpers/errors");
class TagQueryDomain {
  constructor(db) { this.query = new Query(db); }
  async listTags(payload) {
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) return wrapper.error(new InternalServerError("Unable to retrieve tags"));
    const total = count.rows[0]?.total || 0;
    return wrapper.paginationData(rows.rows, { page: payload.page, limit: payload.limit, total, total_pages: Math.ceil(total / payload.limit) });
  }
}
module.exports = TagQueryDomain;
