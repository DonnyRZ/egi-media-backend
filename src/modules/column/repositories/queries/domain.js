const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { decrypt } = require("../../../../helpers/utils/crypto_helper");
const {
  NotFoundError,
  ForbiddenError,
} = require("../../../../helpers/errors");
const ctx = "Column-Query-Domain";

const DEFAULT_LOCALE = "id";
const TRANSLATION_LOCALES = ["en", "uz"];

const resolveAuthorEmail = (value) => {
  if (!value || typeof value !== "string") return null;
  return decrypt(value) || value;
};

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

class ColumnQueryDomain {
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
      slug: pickLocalized(row, "slug", locale),
      summary: pickLocalized(row, "summary", locale) || null,
      featured_image: row.featured_image || null,
      status: row.status,
      rejection_reason: row.rejection_reason || null,
      published_at: row.published_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: {
        id: row.author_id,
        full_name: row.author_full_name,
        email: resolveAuthorEmail(row.author_email),
        role: row.author_role || null,
      },
    };
  }

  mapColumnDetail(row, requestedLocale = DEFAULT_LOCALE) {
    const available = getAvailableLocales(row);
    const locale = resolveLocale(requestedLocale, available);

    const translations = {
      id: {
        title: row.title,
        slug: row.slug,
        summary: row.summary || null,
        content: row.content,
      },
    };
    for (const loc of TRANSLATION_LOCALES) {
      if (!available.includes(loc)) continue;
      translations[loc] = {
        title: row[`title_${loc}`],
        slug: row[`slug_${loc}`] || null,
        summary: row[`summary_${loc}`] || null,
        content: row[`content_${loc}`] ?? null,
      };
    }

    return {
      id: row.id,
      default_locale: DEFAULT_LOCALE,
      locale,
      requested_locale: requestedLocale,
      available_locales: available,
      title: pickLocalized(row, "title", locale),
      slug: pickLocalized(row, "slug", locale),
      summary: pickLocalized(row, "summary", locale) || null,
      content: pickLocalized(row, "content", locale),
      translations,
      featured_image: row.featured_image || null,
      status: row.status,
      rejection_reason: row.rejection_reason || null,
      reviewed_by: row.reviewed_by || null,
      reviewed_at: row.reviewed_at || null,
      published_at: row.published_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      view_count: row.view_count || 0,
      share_count: row.share_count || 0,
      save_count: row.save_count || 0,
      comment_count: row.comment_count || 0,
      author: {
        id: row.author_id,
        full_name: row.author_full_name,
        email: resolveAuthorEmail(row.author_email),
        role: row.author_role || null,
      },
    };
  }

  async getColumns(payload) {
    const { page, limit, search, author_id, sort, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [columnsResult, countResult] = await Promise.all([
      this.query.findAllPublishedColumns({ page, limit, search, author_id, sort }),
      this.query.countAllPublishedColumns({ search, author_id }),
    ]);

    if (columnsResult.err) {
      logger.error(ctx, "getColumns", "Failed to fetch columns", columnsResult.err);
      return wrapper.error(columnsResult.err);
    }
    if (countResult.err) {
      logger.error(ctx, "getColumns", "Failed to count columns", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    return wrapper.data({
      items: columnsResult.data.map((row) => this.mapListItem(row, requestedLocale)),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    });
  }

  async getColumnById(payload) {
    const { id, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const columnResult = await this.query.findColumnById(id);
    if (columnResult.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    // Public detail: only published columns
    if (columnResult.data.status !== "published") {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    return wrapper.data(this.mapColumnDetail(columnResult.data, requestedLocale));
  }

  async getColumnBySlug(payload) {
    const { slug, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const columnResult = await this.query.findColumnBySlug(slug);
    if (columnResult.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    return wrapper.data(this.mapColumnDetail(columnResult.data, requestedLocale));
  }

  async getMyColumnById(payload) {
    const { id, author_id, actor_role, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const columnResult = await this.query.findColumnById(id);
    if (columnResult.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    const column = columnResult.data;
    if (actor_role !== "superadmin" && column.author_id !== author_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to access this column"));
    }

    return wrapper.data(this.mapColumnDetail(column, requestedLocale));
  }

  async getMyColumns(payload) {
    const { author_id, page, limit, status, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [columnsResult, countResult] = await Promise.all([
      this.query.findMyColumns({ author_id, page, limit, status }),
      this.query.countMyColumns({ author_id, status }),
    ]);

    if (columnsResult.err) {
      return wrapper.error(columnsResult.err);
    }
    if (countResult.err) {
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    return wrapper.data({
      items: columnsResult.data.map((row) => this.mapListItem(row, requestedLocale)),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    });
  }

  async getPendingColumns(payload) {
    const { page, limit, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [columnsResult, countResult] = await Promise.all([
      this.query.findPendingColumns({ page, limit }),
      this.query.countPendingColumns(),
    ]);

    if (columnsResult.err) {
      return wrapper.error(columnsResult.err);
    }
    if (countResult.err) {
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    return wrapper.data({
      items: columnsResult.data.map((row) => this.mapListItem(row, requestedLocale)),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    });
  }

  async getManageColumns(payload) {
    const { page, limit, search, status, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [columnsResult, countResult] = await Promise.all([
      this.query.findManageColumns({ page, limit, search, status }),
      this.query.countManageColumns({ search, status }),
    ]);

    if (columnsResult.err) {
      logger.error(ctx, "getManageColumns", "Failed to fetch columns", columnsResult.err);
      return wrapper.error(columnsResult.err);
    }
    if (countResult.err) {
      logger.error(ctx, "getManageColumns", "Failed to count columns", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    return wrapper.data({
      items: columnsResult.data.map((row) => this.mapListItem(row, requestedLocale)),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    });
  }

  async getSavedColumns(payload) {
    const { user_id, page, limit, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [columnsResult, countResult] = await Promise.all([
      this.query.findSavedColumns({ user_id, page, limit }),
      this.query.countSavedColumns(user_id),
    ]);

    if (columnsResult.err) {
      return wrapper.error(columnsResult.err);
    }
    if (countResult.err) {
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    return wrapper.data({
      items: columnsResult.data.map((row) => ({
        ...this.mapListItem(row, requestedLocale),
        saved_at: row.saved_at,
      })),
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    });
  }

  async getComments(payload) {
    const { column_id, page, limit } = payload;

    const columnExists = await this.query.findColumnExistsById(column_id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }
    if (columnExists.data.status !== "published") {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    const [commentsResult, countResult] = await Promise.all([
      this.query.findComments({ column_id, page, limit }),
      this.query.countComments(column_id),
    ]);

    if (commentsResult.err) {
      return wrapper.error(commentsResult.err);
    }
    if (countResult.err) {
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const items = commentsResult.data.map((row) => ({
      id: row.id,
      column_id: row.column_id,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        full_name: row.user_full_name,
        role: row.user_role,
      },
    }));

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    });
  }
}

module.exports = ColumnQueryDomain;
