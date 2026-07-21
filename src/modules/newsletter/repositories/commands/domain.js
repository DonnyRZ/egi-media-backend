const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

const TRANSLATION_LOCALES = ["en", "uz"];

const buildTranslationValues = (translations, { patch = false } = {}) => {
  const translationValues = {};
  const updatedTranslationFields = [];

  for (const loc of TRANSLATION_LOCALES) {
    const entry = translations?.[loc];
    if (!entry) continue;

    if (!patch || entry.name !== undefined) {
      translationValues[`name_${loc}`] = entry.name ?? null;
      updatedTranslationFields.push(`name_${loc}`);
    }
    if (!patch || entry.description !== undefined) {
      translationValues[`description_${loc}`] = entry.description ?? null;
      updatedTranslationFields.push(`description_${loc}`);
    }
  }

  return { translationValues, updatedTranslationFields };
};

class NewsletterCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createNewsletter(payload) {
    const existing = await this.query.findOneByName(payload.name);
    if (!existing) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (existing.rows.length > 0) {
      return wrapper.error(new ConflictError("Newsletter name already exists"));
    }

    const { translationValues } = buildTranslationValues(payload.translations);

    const result = await this.command.insertOne({
      id: randomUUID(),
      name: payload.name,
      description: payload.description || null,
      frequency: payload.frequency,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      created_at: new Date(),
      name_en: translationValues.name_en ?? null,
      description_en: translationValues.description_en ?? null,
      name_uz: translationValues.name_uz ?? null,
      description_uz: translationValues.description_uz ?? null,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to create newsletter"));
    }
    return wrapper.data(result.rows[0]);
  }

  async updateNewsletter(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Newsletter not found"));
    }

    const duplicate = await this.query.findOneByName(payload.name);
    if (!duplicate) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (duplicate.rows.length > 0 && duplicate.rows[0].id !== payload.id) {
      return wrapper.error(new ConflictError("Newsletter name already exists"));
    }

    const { translationValues, updatedTranslationFields } = buildTranslationValues(
      payload.translations,
      { patch: true }
    );

    const result = await this.command.updateOne({
      id: payload.id,
      name: payload.name,
      description: payload.description || null,
      frequency: payload.frequency,
      is_active: payload.is_active,
      translationValues,
      updatedTranslationFields,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to update newsletter"));
    }
    return wrapper.data(result.rows[0]);
  }

  async deleteNewsletter({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Newsletter not found"));
    }

    const result = await this.command.deleteNewsletterCascade(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to delete newsletter"));
    }

    // result is the output of transaction queries; the last query deleted the newsletter
    const deletedNewsletter = result[2]?.rows[0];
    if (!deletedNewsletter) {
      return wrapper.error(new InternalServerError("Unable to delete newsletter"));
    }
    return wrapper.data(deletedNewsletter);
  }

  async addArticleToNewsletter(payload) {
    const newsletter = await this.query.findOneById(payload.id);
    if (!newsletter) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (newsletter.rows.length === 0) {
      return wrapper.error(new NotFoundError("Newsletter not found"));
    }

    const article = await this.query.findOneArticleById(payload.article_id);
    if (!article) {
      return wrapper.error(new InternalServerError("Unable to validate article"));
    }
    if (article.rows.length === 0) {
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const existingMapping = await this.query.findNewsletterArticle(payload.id, payload.article_id);
    if (!existingMapping) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter articles"));
    }
    if (existingMapping.rows.length > 0) {
      return wrapper.error(new ConflictError("Article already added to this newsletter"));
    }

    const result = await this.command.insertNewsletterArticle({
      newsletter_id: payload.id,
      article_id: payload.article_id,
      display_order: payload.display_order || 0,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to add article to newsletter"));
    }
    return wrapper.data(result.rows[0]);
  }

  async removeArticleFromNewsletter(payload) {
    const newsletter = await this.query.findOneById(payload.id);
    if (!newsletter) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (newsletter.rows.length === 0) {
      return wrapper.error(new NotFoundError("Newsletter not found"));
    }

    const existingMapping = await this.query.findNewsletterArticle(payload.id, payload.article_id);
    if (!existingMapping) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter articles"));
    }
    if (existingMapping.rows.length === 0) {
      return wrapper.error(new NotFoundError("Article not found in this newsletter"));
    }

    const result = await this.command.deleteNewsletterArticle({
      newsletter_id: payload.id,
      article_id: payload.article_id,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to remove article from newsletter"));
    }
    return wrapper.data(result.rows[0]);
  }

  async subscribeToNewsletter(payload) {
    const newsletter = await this.query.findOneById(payload.id);
    if (!newsletter) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (newsletter.rows.length === 0) {
      return wrapper.error(new NotFoundError("Newsletter not found"));
    }
    if (!newsletter.rows[0].is_active) {
      return wrapper.error(new BadRequestError("Cannot subscribe to an inactive newsletter"));
    }

    const existingSub = await this.query.findSubscriber(payload.id, payload.user_id);
    if (!existingSub) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter subscriptions"));
    }
    if (existingSub.rows.length > 0) {
      return wrapper.error(new ConflictError("Already subscribed to this newsletter"));
    }

    const result = await this.command.insertSubscriber({
      newsletter_id: payload.id,
      user_id: payload.user_id,
      subscribed_at: new Date(),
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to subscribe to newsletter"));
    }
    return wrapper.data(result.rows[0]);
  }

  async unsubscribeFromNewsletter(payload) {
    const newsletter = await this.query.findOneById(payload.id);
    if (!newsletter) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter"));
    }
    if (newsletter.rows.length === 0) {
      return wrapper.error(new NotFoundError("Newsletter not found"));
    }

    const existingSub = await this.query.findSubscriber(payload.id, payload.user_id);
    if (!existingSub) {
      return wrapper.error(new InternalServerError("Unable to validate newsletter subscriptions"));
    }
    if (existingSub.rows.length === 0) {
      return wrapper.error(new NotFoundError("You are not subscribed to this newsletter"));
    }

    const result = await this.command.deleteSubscriber({
      newsletter_id: payload.id,
      user_id: payload.user_id,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to unsubscribe from newsletter"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = NewsletterCommandDomain;
