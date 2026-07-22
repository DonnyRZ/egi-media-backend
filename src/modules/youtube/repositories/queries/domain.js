const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

// Indonesian (id) is the primary language; en/uz are optional translations.
const DEFAULT_LOCALE = "id";
const TRANSLATION_LOCALES = ["en", "uz"];

const getAvailableLocales = (row) => {
  const locales = [DEFAULT_LOCALE];
  for (const loc of TRANSLATION_LOCALES) {
    if (row[`title_${loc}`]) locales.push(loc);
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

class YoutubeQueryDomain {
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
      title: pickLocalized(row, "title", locale),
      description: pickLocalized(row, "description", locale) || null,
      url: row.url,
      is_active: row.is_active !== false,
      created_at: row.created_at,
    };
  }

  mapVideoDetail(row, requestedLocale = DEFAULT_LOCALE) {
    const available = getAvailableLocales(row);
    const locale = resolveLocale(requestedLocale, available);

    const translations = {
      id: {
        title: row.title,
        description: row.description || null,
      },
    };
    for (const loc of TRANSLATION_LOCALES) {
      if (!available.includes(loc)) continue;
      translations[loc] = {
        title: row[`title_${loc}`],
        description: row[`description_${loc}`] || null,
      };
    }

    return {
      id: row.id,
      default_locale: DEFAULT_LOCALE,
      locale,
      requested_locale: requestedLocale,
      available_locales: available,
      title: pickLocalized(row, "title", locale),
      description: pickLocalized(row, "description", locale) || null,
      url: row.url,
      is_active: row.is_active !== false,
      translations,
      created_at: row.created_at,
    };
  }

  async listYoutubeVideos(payload) {
    const requestedLocale = payload.lang || DEFAULT_LOCALE;
    const { rows, count } = await this.query.findMany(payload);
    if (!rows || !count) {
      return wrapper.error(new InternalServerError("Unable to retrieve YouTube videos"));
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

  async getYoutubeVideo({ id, lang }) {
    const requestedLocale = lang || DEFAULT_LOCALE;
    const result = await this.query.findOneById(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to retrieve YouTube video"));
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("YouTube video not found"));
    }
    return wrapper.data(this.mapVideoDetail(result.rows[0], requestedLocale));
  }
}

module.exports = YoutubeQueryDomain;
