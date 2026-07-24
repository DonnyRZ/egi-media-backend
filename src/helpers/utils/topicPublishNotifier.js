const config = require("../../config/global_config");
const logger = require("./logger");
const { addEmailJob } = require("../queues/email.queue");
const newArticleAlertEmail = require("./newArticleAlertEmail");

const ctx = "TopicPublishNotifier";

/**
 * Resolve distinct subscriber emails for one or more topics.
 * @param {object} db
 * @param {string[]} topicIds
 * @returns {Promise<string[]>}
 */
async function findSubscriberEmailsByTopicIds(db, topicIds) {
  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    return [];
  }

  const result = await db.executeQuery(
    `SELECT DISTINCT LOWER(TRIM(u.email)) AS email
     FROM user_topic_subscriptions uts
     INNER JOIN users u ON u.id = uts.user_id
     WHERE uts.topic_id = ANY($1::uuid[])
       AND u.deleted_at IS NULL
       AND u.email IS NOT NULL
       AND TRIM(u.email) <> ''
       AND u.email_verified_at IS NOT NULL;`,
    [topicIds]
  );

  if (!result?.rows?.length) {
    return [];
  }

  return result.rows.map((row) => row.email).filter(Boolean);
}

/**
 * Load topic ids attached to an article.
 * @param {object} db
 * @param {string} articleId
 * @returns {Promise<string[]>}
 */
async function findTopicIdsByArticleId(db, articleId) {
  const result = await db.executeQuery(
    `SELECT topic_id
     FROM article_topics
     WHERE article_id = $1;`,
    [articleId]
  );

  if (!result?.rows?.length) {
    return [];
  }

  return result.rows.map((row) => row.topic_id).filter(Boolean);
}

/**
 * Queue individual new-article alert emails for topic subscribers.
 * Never throws to callers — designed for fire-and-forget use.
 *
 * @param {{
 *   db: object,
 *   article: { id: string, title?: string, slug?: string, summary?: string|null, featured_image?: string|null },
 *   topicIds?: string[]|null,
 * }} params
 */
async function notifyTopicSubscribersOnPublish({ db, article, topicIds }) {
  try {
    if (!article?.id) {
      return;
    }

    const resolvedTopicIds =
      Array.isArray(topicIds) && topicIds.length > 0
        ? topicIds
        : await findTopicIdsByArticleId(db, article.id);

    if (!resolvedTopicIds.length) {
      logger.info(ctx, "notifyTopicSubscribersOnPublish", "No topics on article; skip email", {
        articleId: article.id,
      });
      return;
    }

    const emails = await findSubscriberEmailsByTopicIds(db, resolvedTopicIds);
    if (!emails.length) {
      logger.info(ctx, "notifyTopicSubscribersOnPublish", "No subscribers to notify", {
        articleId: article.id,
        topicCount: resolvedTopicIds.length,
      });
      return;
    }

    const frontendUrl = (config.get("/frontendUrl") || "http://localhost:3000").replace(/\/$/, "");
    const articleUrl = `${frontendUrl}/id/articles/${encodeURIComponent(article.slug || article.id)}`;
    const html = newArticleAlertEmail({
      title: article.title || "New article",
      summary: article.summary || null,
      imageUrl: article.featured_image || null,
      articleUrl,
    });
    const subject = `New on EGI Media: ${article.title || "New article"}`;

    logger.info(ctx, "notifyTopicSubscribersOnPublish", "Queueing article alert emails", {
      articleId: article.id,
      recipientCount: emails.length,
    });

    // Individual sends keep recipient emails private (no shared To/BCC list).
    // Fire-and-forget each job so publish API is not blocked by SMTP/Redis.
    for (const email of emails) {
      void addEmailJob({
        to: email,
        subject,
        html,
      }).catch((error) => {
        logger.error(ctx, "notifyTopicSubscribersOnPublish", "Failed to queue article alert", {
          email,
          articleId: article.id,
          error: error?.message || error,
        });
      });
    }
  } catch (error) {
    logger.error(ctx, "notifyTopicSubscribersOnPublish", "Unexpected notifier failure", {
      articleId: article?.id,
      error: error?.message || error,
    });
  }
}

module.exports = {
  notifyTopicSubscribersOnPublish,
  findSubscriberEmailsByTopicIds,
  findTopicIdsByArticleId,
};
