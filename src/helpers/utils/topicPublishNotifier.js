const config = require("../../config/global_config");
const logger = require("./logger");
const { addEmailJob } = require("../queues/email.queue");
const { hasSmtpConfig } = require("./mailer");
const { decrypt } = require("./crypto_helper");
const newArticleAlertEmail = require("./newArticleAlertEmail");

const ctx = "TopicPublishNotifier";

/**
 * Decrypt a stored email and keep only valid plaintext addresses.
 * @param {unknown} value
 * @returns {string|null}
 */
function toPlainEmail(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  let plain;
  try {
    plain = decrypt(value);
  } catch (error) {
    console.error("[TopicPublishEmail] Failed to decrypt subscriber email", error);
    return null;
  }

  if (typeof plain !== "string") {
    return null;
  }

  const normalized = plain.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return null;
  }

  return normalized;
}

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

  // Select raw encrypted email — do NOT LOWER/TRIM in SQL (breaks AES ciphertext).
  const result = await db.executeQuery(
    `SELECT DISTINCT u.email AS email
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

  const emails = result.rows
    .map((row) => toPlainEmail(row.email))
    .filter((email) => email && email.includes("@"));

  return Array.from(new Set(emails));
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
    console.log("[TopicPublishEmail] Publish notify started", {
      articleId: article?.id,
      title: article?.title,
      providedTopicIds: topicIds ?? null,
      smtpConfigured: hasSmtpConfig,
    });

    if (!article?.id) {
      console.warn("[TopicPublishEmail] Skipped: article id missing");
      return;
    }

    const resolvedTopicIds =
      Array.isArray(topicIds) && topicIds.length > 0
        ? topicIds
        : await findTopicIdsByArticleId(db, article.id);

    console.log("topic_id:", resolvedTopicIds);

    if (!resolvedTopicIds.length) {
      console.warn(
        "[TopicPublishEmail] Skipped: article has no topic_id values in article_topics / payload"
      );
      logger.info(ctx, "notifyTopicSubscribersOnPublish", "No topics on article; skip email", {
        articleId: article.id,
      });
      return;
    }

    const emails = await findSubscriberEmailsByTopicIds(db, resolvedTopicIds);
    console.log("Found subscribers:", emails);
    console.log("[TopicPublishEmail] Decrypted plaintext recipients ready for queue", {
      count: emails.length,
    });

    if (!emails.length) {
      console.warn(
        "[TopicPublishEmail] Skipped: no verified subscriber emails for topic_id(s)",
        resolvedTopicIds
      );
      console.warn(
        "[TopicPublishEmail] Hint: subscribers must exist in user_topic_subscriptions and users.email_verified_at must be set"
      );
      logger.info(ctx, "notifyTopicSubscribersOnPublish", "No subscribers to notify", {
        articleId: article.id,
        topicCount: resolvedTopicIds.length,
      });
      return;
    }

    const frontendUrl = (config.get("/frontendUrl") || "http://localhost:3000").replace(
      /\/$/,
      ""
    );
    const articleUrl = `${frontendUrl}/id/articles/${encodeURIComponent(
      article.slug || article.id
    )}`;
    const preferencesUrl = `${frontendUrl}/id/settings/topics`;
    const absoluteFeaturedImage = newArticleAlertEmail.toAbsoluteUrl(
      article.featured_image || null
    );

    console.log("[TopicPublishEmail] Media URLs", {
      featuredImageRaw: article.featured_image || null,
      featuredImageAbsolute: absoluteFeaturedImage,
    });

    const html = newArticleAlertEmail({
      title: article.title || "New article",
      summary: article.summary || null,
      imageUrl: absoluteFeaturedImage,
      articleUrl,
      preferencesUrl,
    });
    const subject = `New on EGI Media: ${article.title || "New article"}`;

    console.log("[TopicPublishEmail] Queueing emails", {
      articleId: article.id,
      articleUrl,
      recipientCount: emails.length,
    });

    logger.info(ctx, "notifyTopicSubscribersOnPublish", "Queueing article alert emails", {
      articleId: article.id,
      recipientCount: emails.length,
    });

    // Individual sends keep recipient emails private (no shared To/BCC list).
    // Fire-and-forget each job so publish API is not blocked by SMTP/Redis.
    for (const email of emails) {
      console.log("[TopicPublishEmail] Dispatching email job to:", email);
      void addEmailJob({
        to: email,
        subject,
        html,
      })
        .then((job) => {
          console.log("[TopicPublishEmail] Email job accepted", {
            to: email,
            jobId: job?.id ?? null,
            mode: job?.id ? "queued" : "direct-or-fallback",
          });
        })
        .catch((error) => {
          console.error("Email Send Error:", error);
          logger.error(ctx, "notifyTopicSubscribersOnPublish", "Failed to queue article alert", {
            email,
            articleId: article.id,
            error: error?.message || error,
          });
        });
    }
  } catch (error) {
    console.error("Email Send Error:", error);
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
