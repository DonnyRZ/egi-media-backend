const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError } = require("../../../../helpers/errors");

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

const mapTopic = (row, requestedLocale) => {
  const available = getAvailableLocales(row);
  const locale = resolveLocale(requestedLocale, available);
  return {
    id: row.id,
    locale,
    available_locales: available,
    name: pickLocalized(row, "name", locale),
    slug: pickLocalized(row, "slug", locale),
    description: pickLocalized(row, "description", locale) || null,
    subscribed_at: row.subscribed_at || null,
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
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const groupTopicsByCategory = (topics, requestedLocale) => {
  const groupsMap = new Map();

  for (const row of topics) {
    const topic = mapTopic(row, requestedLocale);
    const categoryKey = row.category_id || "uncategorized";
    if (!groupsMap.has(categoryKey)) {
      groupsMap.set(categoryKey, {
        category: topic.category,
        topics: [],
      });
    }
    groupsMap.get(categoryKey).topics.push(topic);
  }

  return Array.from(groupsMap.values()).sort((a, b) => {
    const nameA = a.category?.name || "";
    const nameB = b.category?.name || "";
    if (!a.category) return 1;
    if (!b.category) return -1;
    return nameA.localeCompare(nameB);
  });
};

const toRows = (result) => (Array.isArray(result?.rows) ? result.rows : []);

class UserTopicSubscriptionQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async listMyTopics({ user_id, lang }) {
    const requestedLocale = lang || DEFAULT_LOCALE;
    const result = await this.query.findSubscribedTopicsByUser(user_id);
    const rows = toRows(result);
    const items = rows.map((row) => mapTopic(row, requestedLocale));

    return wrapper.data({
      items,
      groups: groupTopicsByCategory(rows, requestedLocale),
      meta: { total: items.length },
    });
  }

  async listTopicCatalog({ lang }) {
    const requestedLocale = lang || DEFAULT_LOCALE;
    const result = await this.query.findTopicsCatalog();
    const rows = toRows(result);
    const items = rows.map((row) => mapTopic(row, requestedLocale));

    return wrapper.data({
      items,
      groups: groupTopicsByCategory(rows, requestedLocale),
      meta: { total: items.length },
    });
  }

  async getSubscriptionStats() {
    const result = await this.query.findSubscriptionStats();
    const rows = toRows(result);
    const items = rows.map((row) => ({
      topic_id: row.topic_id,
      topic_name: row.topic_name,
      topic_slug: row.topic_slug,
      category_id: row.category_id || null,
      category_name: row.category_name || null,
      category_slug: row.category_slug || null,
      subscriber_count: row.subscriber_count || 0,
    }));

    return wrapper.data({
      items,
      meta: {
        total_topics: items.length,
        total_subscribers: items.reduce((sum, item) => sum + item.subscriber_count, 0),
      },
    });
  }

  async getTopicSubscribers({ topic_id }) {
    const topic = await this.query.findTopicById(topic_id);
    if (!toRows(topic).length) {
      return wrapper.error(new NotFoundError("Topic not found"));
    }

    const result = await this.query.findTopicSubscribers(topic_id);
    const rows = toRows(result);
    const items = rows.map((row) => ({
      user_id: row.user_id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      subscribed_at: row.subscribed_at,
    }));

    return wrapper.data({
      topic: {
        id: topic.rows[0].id,
        name: topic.rows[0].name,
        slug: topic.rows[0].slug,
      },
      items,
      meta: { total: items.length },
    });
  }
}

module.exports = UserTopicSubscriptionQueryDomain;
