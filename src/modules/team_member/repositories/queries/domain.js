const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

class TeamMemberQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  mapItem(row) {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      bio: row.bio || null,
      photo_url: row.photo_url,
      is_active: row.is_active !== false,
      sort_order: row.sort_order ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async listTeamMembers(payload) {
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(
        new InternalServerError("Unable to retrieve team members")
      );
    }

    const total = count.rows[0]?.total || 0;
    const items = rows.rows.map((row) => this.mapItem(row));

    return wrapper.paginationData(items, {
      page: payload.page,
      limit: payload.limit,
      total,
      total_pages: Math.ceil(total / payload.limit) || 0,
    });
  }

  async getTeamMember({ id }) {
    const result = await this.query.findOneById(id);
    if (!result) {
      return wrapper.error(
        new InternalServerError("Unable to retrieve team member")
      );
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Team member not found"));
    }
    return wrapper.data(this.mapItem(result.rows[0]));
  }
}

module.exports = TeamMemberQueryDomain;
