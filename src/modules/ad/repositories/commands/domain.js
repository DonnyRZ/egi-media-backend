const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

class AdCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addAd() {
    return wrapper.error(
      new ForbiddenError("Ad slots are fixed. Update an existing placement instead."),
    );
  }

  async updateAd(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(
        new InternalServerError("Unable to validate advertisement")
      );
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Advertisement not found"));
    }

    const result = await this.command.updateOne({
      id: payload.id,
      title: payload.title,
      image_url: payload.image_url,
      target_url: payload.target_url,
      is_active: payload.is_active !== false,
      updated_at: new Date(),
    });

    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to update advertisement")
      );
    }
    return wrapper.data(result.rows[0]);
  }

  async deleteAd() {
    return wrapper.error(
      new ForbiddenError(
        "Ad slots cannot be deleted. Set the slot to inactive instead.",
      ),
    );
  }

  async trackClick({ id }) {
    const result = await this.command.incrementClicks(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to track click"));
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Advertisement not found"));
    }
    return wrapper.data(result.rows[0]);
  }

  async trackImpression({ id }) {
    const result = await this.command.incrementImpressions(id);
    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to track impression")
      );
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Advertisement not found"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = AdCommandDomain;
