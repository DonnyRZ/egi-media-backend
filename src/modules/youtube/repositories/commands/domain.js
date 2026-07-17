const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

const TRANSLATION_LOCALES = ["en", "uz"];

const buildTranslationValues = (translations, { patch = false } = {}) => {
  const translationValues = {};
  const updatedTranslationFields = [];

  for (const loc of TRANSLATION_LOCALES) {
    const entry = translations?.[loc];
    if (!entry) continue;

    if (!patch || entry.title !== undefined) {
      translationValues[`title_${loc}`] = entry.title ?? null;
      updatedTranslationFields.push(`title_${loc}`);
    }
    if (!patch || entry.description !== undefined) {
      translationValues[`description_${loc}`] = entry.description ?? null;
      updatedTranslationFields.push(`description_${loc}`);
    }
  }

  return { translationValues, updatedTranslationFields };
};

class YoutubeCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addYoutubeVideo(payload) {
    const { translationValues } = buildTranslationValues(payload.translations);

    const result = await this.command.insertOne({
      id: randomUUID(),
      title: payload.title,
      description: payload.description || null,
      url: payload.url,
      created_at: new Date(),
      title_en: translationValues.title_en ?? null,
      description_en: translationValues.description_en ?? null,
      title_uz: translationValues.title_uz ?? null,
      description_uz: translationValues.description_uz ?? null,
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

    const { translationValues, updatedTranslationFields } = buildTranslationValues(
      payload.translations,
      { patch: true }
    );

    const result = await this.command.updateOne({
      id: payload.id,
      title: payload.title,
      description: payload.description || null,
      url: payload.url,
      translationValues,
      updatedTranslationFields,
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
