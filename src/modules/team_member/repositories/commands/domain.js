const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

class TeamMemberCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addTeamMember(payload) {
    const now = new Date();
    const result = await this.command.insertOne({
      id: randomUUID(),
      name: payload.name,
      role: payload.role,
      bio: payload.bio || null,
      photo_url: payload.photo_url,
      is_active: payload.is_active !== false,
      sort_order: payload.sort_order ?? 0,
      created_at: now,
      updated_at: now,
    });

    if (!result) {
      return wrapper.error(new InternalServerError("Unable to add team member"));
    }
    return wrapper.data(result.rows[0]);
  }

  async updateTeamMember(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(
        new InternalServerError("Unable to validate team member")
      );
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Team member not found"));
    }

    const result = await this.command.updateOne({
      id: payload.id,
      name: payload.name,
      role: payload.role,
      bio: payload.bio || null,
      photo_url: payload.photo_url,
      is_active: payload.is_active !== false,
      sort_order: payload.sort_order ?? 0,
      updated_at: new Date(),
    });

    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to update team member")
      );
    }
    return wrapper.data(result.rows[0]);
  }

  async deleteTeamMember({ id }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(
        new InternalServerError("Unable to validate team member")
      );
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Team member not found"));
    }

    const result = await this.command.deleteOne(id);
    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to delete team member")
      );
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = TeamMemberCommandDomain;
