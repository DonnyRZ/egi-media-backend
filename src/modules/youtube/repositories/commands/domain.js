const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

class YoutubeCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addYoutubeVideo(payload) {
    const result = await this.command.insertOne({
      id: randomUUID(),
      title: payload.title,
      description: payload.description || null,
      url: payload.url,
      created_at: new Date(),
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to add YouTube video"));
    }
    return wrapper.data(result.rows[0]);
  }

  async updateYoutubeVideo(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate YouTube video"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("YouTube video not found"));
    }

    const result = await this.command.updateOne({
      id: payload.id,
      title: payload.title,
      description: payload.description || null,
      url: payload.url,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to update YouTube video"));
    }
    return wrapper.data(result.rows[0]);
  }

  async deleteYoutubeVideo({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate YouTube video"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("YouTube video not found"));
    }

    const result = await this.command.deleteOne(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to delete YouTube video"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = YoutubeCommandDomain;
