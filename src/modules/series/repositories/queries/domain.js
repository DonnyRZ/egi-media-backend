const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

// Indonesian (id) is the primary language; en/uz are optional translations.
const DEFAULT_LOCALE = "id";
const TRANSLATION_LOCALES = ["en", "uz"];

const getAvailableLocales = (row) => {
  const locales = [DEFAULT_LOCALE];
  for (const loc of TRANSLATION_LOCALES) {
    if (row[`name_${loc}`]) locales.push(loc);
  }
  return locales;
};

const resolveLocale = (requested, available) =>
  available.includes(requested) ? requested : DEFAULT_LOCALE;

const pickLocalized = (row, field, locale) => {
  if (locale === DEFAULT_LOCALE) return row[field];
  const value = row[`${field}_${locale}`];
  return value !== undefined && value !== null && value !== "" ? value : row[field];
};

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

  mapListItem(row, requestedLocale) {
    const available = getAvailableLocales(row);
    const locale = resolveLocale(requestedLocale, available);
    return {
      id: row.id,
      locale,
      available_locales: available,
      name: pickLocalized(row, "name", locale),
      slug: pickLocalized(row, "slug", locale),
      description: pickLocalized(row, "description", locale) || null,
      image: row.image || null,
      article_count: row.article_count ?? 0,
      created_at: row.created_at,
    };
  }

  mapSeriesDetail(row, articles, requestedLocale = DEFAULT_LOCALE) {
    const available = getAvailableLocales(row);
    const locale = resolveLocale(requestedLocale, available);

    const translations = {
      id: {
        name: row.name,
        slug: row.slug,
        description: row.description || null,
      },
    };
    for (const loc of TRANSLATION_LOCALES) {
      if (!available.includes(loc)) continue;
      translations[loc] = {
        name: row[`name_${loc}`],
        slug: row[`slug_${loc}`] || null,
        description: row[`description_${loc}`] || null,
      };
    }

    return {
      id: row.id,
      default_locale: DEFAULT_LOCALE,
      locale,
      requested_locale: requestedLocale,
      available_locales: available,
      name: pickLocalized(row, "name", locale),
      slug: pickLocalized(row, "slug", locale),
      description: pickLocalized(row, "description", locale) || null,
      // Shared across locales — not part of translations.
      image: row.image || null,
      translations,
      created_at: row.created_at,
      articles: (articles || []).map(toArticleListItem),
    };
  }

  async listSeries(payload) {
    const requestedLocale = payload.lang || DEFAULT_LOCALE;
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(new InternalServerError("Unable to retrieve series"));
    }

    const total = count.rows[0]?.total || 0;
    const items = rows.rows.map((row) => this.mapListItem(row, requestedLocale));

    return wrapper.paginationData(items, {
      page: payload.page,
      limit: payload.limit,
      total,
      total_pages: Math.ceil(total / payload.limit),
    });
  }

  async getSeries({ id, lang }) {
    const requestedLocale = lang || DEFAULT_LOCALE;
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

    return wrapper.data(
      this.mapSeriesDetail(seriesResult.rows[0], articlesResult.rows, requestedLocale)
    );
  }
}

module.exports = SeriesQueryDomain;
