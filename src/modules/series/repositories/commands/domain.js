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
const { toSlug } = require("../../../../helpers/utils/slug");

class SeriesCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createSeries(payload) {
    const slug = toSlug(payload.name);
    if (!slug) {
      return wrapper.error(new BadRequestError("Series name must contain letters or numbers"));
    }

    const existing = await this.query.findOneBySlug(slug);
    if (!existing) {
      return wrapper.error(new InternalServerError("Unable to validate series"));
    }
    if (existing.rows.length > 0) {
      return wrapper.error(new ConflictError("Series name already exists"));
    }

    const result = await this.command.insertOne({
      id: randomUUID(),
      name: payload.name,
      slug,
      description: payload.description || null,
      author_id: payload.author_id,
      created_at: new Date(),
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to create series"));
    }
    return wrapper.data(result.rows[0]);
  }

  async updateSeries(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate series"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Series not found"));
    }
    if (payload.actor_role !== "superadmin" && current.rows[0].author_id !== payload.actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to update this series"));
    }

    const slug = toSlug(payload.name);
    if (!slug) {
      return wrapper.error(new BadRequestError("Series name must contain letters or numbers"));
    }
    const duplicate = await this.query.findOneBySlug(slug);
    if (!duplicate) {
      return wrapper.error(new InternalServerError("Unable to validate series"));
    }
    if (duplicate.rows.length > 0 && duplicate.rows[0].id !== payload.id) {
      return wrapper.error(new ConflictError("Series name already exists"));
    }

    const result = await this.command.updateOne({
      id: payload.id,
      name: payload.name,
      slug,
      description: payload.description || null,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to update series"));
    }
    return wrapper.data(result.rows[0]);
  }

  async deleteSeries({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate series"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Series not found"));
    }

    const reference = await this.query.hasArticleReference(id);
    if (!reference) {
      return wrapper.error(new InternalServerError("Unable to validate series references"));
    }
    if (reference.rows[0].exists) {
      return wrapper.error(new ConflictError("Series is still used by articles"));
    }

    const result = await this.command.deleteOne(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to delete series"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = SeriesCommandDomain;
