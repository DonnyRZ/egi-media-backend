const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError } = require("../../../../helpers/errors");

class NotificationQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async listMyNotifications(payload) {
    const { rows, count, unreadCount } = await this.query.findMany(payload);
    if (!rows || !count || !unreadCount) {
      return wrapper.error(new InternalServerError("Unable to retrieve notifications"));
    }

    const total = count.rows[0]?.total || 0;
    const unread_count = unreadCount.rows[0]?.total || 0;

    return wrapper.data({
      items: rows.rows,
      meta: {
        page: payload.page,
        limit: payload.limit,
        total,
        total_pages: Math.ceil(total / payload.limit),
      },
      unread_count,
    });
  }
}

module.exports = NotificationQueryDomain;
