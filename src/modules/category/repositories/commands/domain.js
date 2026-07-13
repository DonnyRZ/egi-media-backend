const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { BadRequestError, ConflictError, InternalServerError, NotFoundError } = require("../../../../helpers/errors");
const { toSlug } = require("../../../../helpers/utils/slug");

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

    const now = new Date();
    const result = await this.command.insertOne({
      id: randomUUID(),
      name: payload.name,
      slug,
      description: payload.description || null,
      created_at: now,
      updated_at: now,
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

    const result = await this.command.updateOne({
      id: payload.id,
      name: payload.name,
      slug,
      description: payload.description || null,
      updated_at: new Date(),
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
