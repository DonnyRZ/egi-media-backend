const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");

class NotificationCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async markNotificationAsRead({ id, user_id }) {
    const check = await this.query.findOneById(id);
    if (!check) {
      return wrapper.error(new InternalServerError("Unable to validate notification"));
    }
    if (check.rows.length === 0) {
      return wrapper.error(new NotFoundError("Notification not found"));
    }
    if (check.rows[0].user_id !== user_id) {
      return wrapper.error(new NotFoundError("Notification not found"));
    }

    const result = await this.command.updateStatusToRead(id, new Date());
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to mark notification as read"));
    }

    return wrapper.data(true);
  }

  async markAllNotificationsAsRead({ user_id }) {
    const result = await this.command.updateAllStatusToRead(user_id, new Date());
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to mark all notifications as read"));
    }

    return wrapper.data(true);
  }
}

module.exports = NotificationCommandDomain;
