const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { BadRequestError, ConflictError, InternalServerError, NotFoundError } = require("../../../../helpers/errors");
const { toSlug } = require("../../../../helpers/utils/slug");
class TagCommandDomain {
  constructor(db) { this.command = new Command(db); this.query = new Query(db); }
  async createTag(payload) {
    const slug = toSlug(payload.name);
    if (!slug) return wrapper.error(new BadRequestError("Tag name must contain letters or numbers"));
    const existing = await this.query.findOneBySlug(slug);
    if (!existing) return wrapper.error(new InternalServerError("Unable to validate tag"));
    if (existing.rows.length > 0) return wrapper.error(new ConflictError("Tag name already exists"));
    const result = await this.command.insertOne({ id: randomUUID(), name: payload.name, slug, created_at: new Date() });
    if (!result) return wrapper.error(new InternalServerError("Unable to create tag"));
    return wrapper.data(result.rows[0]);
  }
  async deleteTag({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) return wrapper.error(new InternalServerError("Unable to validate tag"));
    if (current.rows.length === 0) return wrapper.error(new NotFoundError("Tag not found"));
    const reference = await this.query.hasArticleReference(id);
    if (!reference) return wrapper.error(new InternalServerError("Unable to validate tag references"));
    if (reference.rows[0].exists) return wrapper.error(new ConflictError("Tag is still used by articles"));
    const result = await this.command.deleteOne(id);
    if (!result) return wrapper.error(new InternalServerError("Unable to delete tag"));
    return wrapper.data(result.rows[0]);
  }
}
module.exports = TagCommandDomain;
