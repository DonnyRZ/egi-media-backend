const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require("../../../../helpers/errors");
const { verifyImage } = require("../../../../helpers/storage/ad-image");

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

    const old = current.rows[0];
    if (payload.placement && payload.placement !== old.placement) {
      return wrapper.error(new BadRequestError("Choose the fixed advertisement slot before editing"));
    }
    if (payload.is_active && (!payload.image_url || !payload.target_url)) {
      return wrapper.error(new BadRequestError("An active advertisement requires an image and target URL"));
    }
    let image = { width: old.image_width, height: old.image_height };
    const changed = payload.image_url !== old.image_url;
    try {
      if (payload.image_url && (changed || payload.image_receipt)) {
        image = verifyImage(payload.image_receipt, payload.image_url, old.placement);
      }
    } catch (error) {
      return wrapper.error(new BadRequestError(error.message));
    }
    if (!payload.image_url) image = { width: null, height: null };

    const result = await this.command.updateOne({
      id: payload.id,
      title: payload.title,
      image_url: payload.image_url,
      target_url: payload.target_url,
      is_active: payload.is_active !== false,
      image_width: image.width,
      image_height: image.height,
      image_receipt: payload.image_url ? payload.image_receipt || (changed ? null : old.image_receipt) : null,
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
