const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

const toArticleListItem = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  summary: row.summary || null,
  featured_image: row.featured_image || null,
  status: row.status,
  published_at: row.published_at || null,
  created_at: row.created_at,
  author: {
    id: row.author_id,
    full_name: row.author_full_name,
  },
  category: row.category_id
    ? { id: row.category_id, name: row.category_name }
    : null,
});

class SeriesQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async listSeries(payload) {
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(new InternalServerError("Unable to retrieve series"));
    }

    const total = count.rows[0]?.total || 0;
    return wrapper.paginationData(rows.rows, {
      page: payload.page,
      limit: payload.limit,
      total,
      total_pages: Math.ceil(total / payload.limit),
    });
  }

  async getSeries({ id }) {
    const [seriesResult, articlesResult] = await Promise.all([
      this.query.findOneById(id),
      this.query.findPublishedArticlesBySeriesId(id),
    ]);
    if (!seriesResult || !articlesResult) {
      return wrapper.error(new InternalServerError("Unable to retrieve series"));
    }
    if (seriesResult.rows.length === 0) {
      return wrapper.error(new NotFoundError("Series not found"));
    }

    const { author_id, ...series } = seriesResult.rows[0];
    return wrapper.data({
      ...series,
      articles: articlesResult.rows.map(toArticleListItem),
    });
  }
}

module.exports = SeriesQueryDomain;
