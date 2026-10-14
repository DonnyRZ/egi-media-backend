const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { BadRequestError, ConflictError, InternalServerError, NotFoundError } = require("../../../../helpers/errors");
const { toSlug } = require("../../../../helpers/utils/slug");
const { buildCategoryTranslationPlan, buildRetryTargets, LOCALES } = require("./translation_plan");
const { enqueueCategoryTranslation } = require("../../../../helpers/utils/categoryTranslationEnqueue");

class CategoryCommandDomain {
  constructor(db) {
    this.db = db;
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async enqueueTranslations(categoryId, sourceName, sourceDescription, targets, requestedBy = null) {
    if (!targets.length) return;
    try {
      await enqueueCategoryTranslation({
        db: this.db,
        categoryId,
        requestedBy,
        sourceName,
        sourceDescription,
        targets,
      });
    } catch (error) {
      // Category persistence must remain successful even if AI/Redis is unavailable.
      const message = error?.message || "Translation queue unavailable";
      await this.db.executeQuery(
        `UPDATE category_translation_state
         SET status = 'failed', last_error = $1, updated_at = NOW()
         WHERE category_id = $2 AND locale = ANY($3::varchar[]) AND status = 'pending'`,
        [message, categoryId, [...new Set(targets.map((target) => target.locale))]],
      );
    }
  }

  async createCategory(payload) {
    const slug = toSlug(payload.name);
    if (!slug) {
      return wrapper.error(new BadRequestError("Category name must contain letters or numbers"));
    }

    const existing = await this.query.findOneBySlug(slug);
    if (!existing) {
      return wrapper.error(new InternalServerError("Unable to validate category"));
    }
    if (existing.rows.length > 0) {
      return wrapper.error(new ConflictError("Category name already exists"));
    }

    const now = new Date();
    const id = randomUUID();
    const plan = buildCategoryTranslationPlan({
      sourceName: payload.name,
      sourceDescription: payload.description || "",
      translations: payload.translations,
    });
    for (const locale of LOCALES) {
      const translatedName = plan.translationValues[`name_${locale}`];
      if (translatedName && !toSlug(translatedName)) {
        return wrapper.error(new BadRequestError(`Category ${locale} name must contain letters or numbers`));
      }
    }

    const result = await this.command.insertOne({
      id,
      name: payload.name,
      slug,
      description: payload.description || null,
      created_at: now,
      updated_at: now,
      name_en: plan.translationValues.name_en,
      slug_en: plan.translationValues.slug_en,
      description_en: plan.translationValues.description_en,
      name_uz: plan.translationValues.name_uz,
      slug_uz: plan.translationValues.slug_uz,
      description_uz: plan.translationValues.description_uz,
      translationStates: plan.states,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to create category"));
    }
    await this.enqueueTranslations(id, payload.name, payload.description || "", plan.targets);
    return wrapper.data({
      ...result.rows[0],
      translation_statuses: plan.states.map(({ locale, status }) => ({ locale, status })),
    });
  }

  async updateCategory(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate category"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Category not found"));
    }

    const slug = toSlug(payload.name);
    if (!slug) {
      return wrapper.error(new BadRequestError("Category name must contain letters or numbers"));
    }
    const duplicate = await this.query.findOneBySlug(slug);
    if (!duplicate) {
      return wrapper.error(new InternalServerError("Unable to validate category"));
    }
    if (duplicate.rows.length > 0 && duplicate.rows[0].id !== payload.id) {
      return wrapper.error(new ConflictError("Category name already exists"));
    }

    const stateResult = await this.query.findTranslationStates(payload.id);
    if (!stateResult) return wrapper.error(new InternalServerError("Unable to validate category translations"));
    const plan = buildCategoryTranslationPlan({
      sourceName: payload.name,
      sourceDescription: payload.description || "",
      translations: payload.translations,
      currentCategory: current.rows[0],
      currentStates: stateResult.rows,
    });
    for (const locale of LOCALES) {
      const translatedName = plan.translationValues[`name_${locale}`];
      if (translatedName && !toSlug(translatedName)) {
        return wrapper.error(new BadRequestError(`Category ${locale} name must contain letters or numbers`));
      }
    }

    const result = await this.command.updateOne({
      id: payload.id,
      name: payload.name,
      slug,
      description: payload.description || null,
      updated_at: new Date(),
      translationValues: plan.translationValues,
      updatedTranslationFields: [
        "name_en", "slug_en", "description_en",
        "name_uz", "slug_uz", "description_uz",
      ],
      translationStates: plan.states,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to update category"));
    }
    await this.enqueueTranslations(payload.id, payload.name, payload.description || "", plan.targets);
    return wrapper.data({
      ...result.rows[0],
      translation_statuses: plan.states.map(({ locale, status }) => ({ locale, status })),
    });
  }

  async retryCategoryTranslation({ id, locale }) {
    const categoryResult = await this.query.findOneById(id);
    if (!categoryResult) return wrapper.error(new InternalServerError("Unable to retrieve category"));
    if (!categoryResult.rows.length) return wrapper.error(new NotFoundError("Category not found"));
    const category = categoryResult.rows[0];
    const stateResult = await this.query.findTranslationStates(id);
    if (!stateResult) return wrapper.error(new InternalServerError("Unable to retrieve translation status"));
    const state = stateResult.rows.find((row) => row.locale === locale);
    if (!state || state.status !== "failed") {
      return wrapper.error(new BadRequestError("Retry is only available for failed category translations"));
    }

    const targets = buildRetryTargets(category, state, locale);
    if (!targets.length) {
      const ready = Boolean(category[`name_${locale}`]) && (!category.description || Boolean(category[`description_${locale}`]));
      await this.db.executeQuery(
        `UPDATE category_translation_state
         SET status = $1::article_translation_status, last_error = NULL, updated_at = NOW()
         WHERE category_id = $2 AND locale = $3`,
        [ready ? "ready" : "none", id, locale],
      );
      return wrapper.data({ category_id: id, locale, status: ready ? "ready" : "none" });
    }

    await this.db.executeQuery(
      `UPDATE category_translation_state
       SET status = 'pending', last_error = NULL, updated_at = NOW()
       WHERE category_id = $1 AND locale = $2 AND status = 'failed'`,
      [id, locale],
    );
    const enqueueResult = await enqueueCategoryTranslation({
      db: this.db,
      categoryId: id,
      sourceName: category.name,
      sourceDescription: category.description || "",
      targets,
    });
    return wrapper.data({
      category_id: id,
      locale,
      job_id: enqueueResult.jobId || null,
      status: enqueueResult.queued ? "pending" : "failed",
      error: enqueueResult.error || null,
    });
  }

  async deleteCategory({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate category"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Category not found"));
    }

    const children = await this.query.hasChildTopics(id);
    if (!children) {
      return wrapper.error(new InternalServerError("Unable to validate category children"));
    }
    if (children.rows[0].exists) {
      return wrapper.error(
        new BadRequestError(
          "Cannot delete Category because it contains child items. Please delete or reassign them first."
        )
      );
    }

    const reference = await this.query.hasArticleReference(id);
    if (!reference) {
      return wrapper.error(new InternalServerError("Unable to validate category references"));
    }
    if (reference.rows[0].exists) {
      return wrapper.error(
        new BadRequestError("Cannot delete because this item is still used by existing articles.")
      );
    }

    const result = await this.command.deleteOne(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to delete category"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = CategoryCommandDomain;
