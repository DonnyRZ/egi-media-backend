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

class NewsletterQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async listNewsletters(payload) {
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(new InternalServerError("Unable to retrieve newsletters"));
    }

    const total = count.rows[0]?.total || 0;
    return wrapper.paginationData(rows.rows, {
      page: payload.page,
      limit: payload.limit,
      total,
      total_pages: Math.ceil(total / payload.limit),
    });
  }

  async getNewsletter({ id }) {
    const [newsletterResult, articlesResult] = await Promise.all([
      this.query.findOneById(id),
      this.query.findArticlesByNewsletterId(id),
    ]);
    if (!newsletterResult || !articlesResult) {
      return wrapper.error(new InternalServerError("Unable to retrieve newsletter"));
    }
    if (newsletterResult.rows.length === 0) {
      return wrapper.error(new NotFoundError("Newsletter not found"));
    }

    const newsletter = newsletterResult.rows[0];
    return wrapper.data({
      ...newsletter,
      articles: articlesResult.rows.map(toArticleListItem),
    });
  }
}

module.exports = NewsletterQueryDomain;
