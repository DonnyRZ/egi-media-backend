const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

class AuditLogQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async listAuditLogs(payload) {
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(new InternalServerError("Unable to retrieve audit logs"));
    }

    const total = count.rows[0]?.total || 0;
    return wrapper.paginationData(rows.rows, {
      page: payload.page,
      limit: payload.limit,
      total,
      total_pages: Math.ceil(total / payload.limit),
    });
  }

  async getAuditLog({ id }) {
    const result = await this.query.findOneById(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to retrieve audit log"));
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Audit log not found"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = AuditLogQueryDomain;
