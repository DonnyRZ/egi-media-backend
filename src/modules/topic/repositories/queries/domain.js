const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

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

class TopicQueryDomain {
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
      category_id: row.category_id || null,
      category: row.category_id
        ? {
            id: row.category_id,
            name: pickLocalized(
              {
                name: row.category_name,
                name_en: row.category_name_en,
                name_uz: row.category_name_uz,
              },
              "name",
              requestedLocale
            ),
            slug: row.category_slug || null,
          }
        : null,
      article_count: row.article_count ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  mapDetail(row, requestedLocale = DEFAULT_LOCALE) {
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
      category_id: row.category_id || null,
      category: row.category_id
        ? {
            id: row.category_id,
            name: pickLocalized(
              {
                name: row.category_name,
                name_en: row.category_name_en,
                name_uz: row.category_name_uz,
              },
              "name",
              requestedLocale
            ),
            slug: row.category_slug || null,
          }
        : null,
      translations,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async listTopics(payload) {
    const requestedLocale = payload.lang || DEFAULT_LOCALE;
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(new InternalServerError("Unable to retrieve topics"));
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

  async getTopic({ id, lang }) {
    const requestedLocale = lang || DEFAULT_LOCALE;
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const result = uuidPattern.test(id)
      ? await this.query.findOneById(id)
      : await this.query.findOneBySlug(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to retrieve topic"));
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Topic not found"));
    }
    return wrapper.data(this.mapDetail(result.rows[0], requestedLocale));
  }
}

module.exports = TopicQueryDomain;
