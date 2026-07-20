const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { BadRequestError, ConflictError, InternalServerError, NotFoundError } = require("../../../../helpers/errors");
const { toSlug } = require("../../../../helpers/utils/slug");

const TRANSLATION_LOCALES = ["en", "uz"];

const buildTranslationValues = (translations, { patch = false } = {}) => {
  const translationValues = {};
  const updatedTranslationFields = [];

  for (const loc of TRANSLATION_LOCALES) {
    const entry = translations?.[loc];
    if (!entry) continue;

    if (!patch || entry.name !== undefined) {
      const slug = toSlug(entry.name || "");
      translationValues[`name_${loc}`] = entry.name ?? null;
      translationValues[`slug_${loc}`] = slug || null;
      updatedTranslationFields.push(`name_${loc}`, `slug_${loc}`);
    }
    if (!patch || entry.description !== undefined) {
      translationValues[`description_${loc}`] = entry.description ?? null;
      updatedTranslationFields.push(`description_${loc}`);
    }
  }

  return { translationValues, updatedTranslationFields };
};

class CategoryCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
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

    const { translationValues } = buildTranslationValues(payload.translations);
    for (const loc of TRANSLATION_LOCALES) {
      if (payload.translations?.[loc]?.name && !translationValues[`slug_${loc}`]) {
        return wrapper.error(
          new BadRequestError(`Category ${loc} name must contain letters or numbers`)
        );
      }
    }

    const now = new Date();
    const result = await this.command.insertOne({
      id: randomUUID(),
      name: payload.name,
      slug,
      description: payload.description || null,
      created_at: now,
      updated_at: now,
      name_en: translationValues.name_en ?? null,
      slug_en: translationValues.slug_en ?? null,
      description_en: translationValues.description_en ?? null,
      name_uz: translationValues.name_uz ?? null,
      slug_uz: translationValues.slug_uz ?? null,
      description_uz: translationValues.description_uz ?? null,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to create category"));
    }
    return wrapper.data(result.rows[0]);
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

    const { translationValues, updatedTranslationFields } = buildTranslationValues(
      payload.translations,
      { patch: true }
    );
    for (const loc of TRANSLATION_LOCALES) {
      if (
        payload.translations?.[loc]?.name !== undefined &&
        !translationValues[`slug_${loc}`]
      ) {
        return wrapper.error(
          new BadRequestError(`Category ${loc} name must contain letters or numbers`)
        );
      }
    }

    const result = await this.command.updateOne({
      id: payload.id,
      name: payload.name,
      slug,
      description: payload.description || null,
      updated_at: new Date(),
      translationValues,
      updatedTranslationFields,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to update category"));
    }
    return wrapper.data(result.rows[0]);
  }

  async deleteCategory({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate category"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Category not found"));
    }

    const reference = await this.query.hasArticleReference(id);
    if (!reference) {
      return wrapper.error(new InternalServerError("Unable to validate category references"));
    }
    if (reference.rows[0].exists) {
      return wrapper.error(new ConflictError("Category is still used by articles"));
    }

    const result = await this.command.deleteOne(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to delete category"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = CategoryCommandDomain;
