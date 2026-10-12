const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { notifyEditorsOfSubmission } = require("../../../../helpers/utils/reviewNotifier");
const {
  InternalServerError,
  NotFoundError,
  ForbiddenError,
} = require("../../../../helpers/errors");

const TRANSLATION_LOCALES = ["en", "uz"];
const ELEVATED_ROLES = new Set(["superadmin", "admin"]);

const isElevatedRole = (role) => ELEVATED_ROLES.has(role);

const canMutateVideo = (video, actorId, actorRole) =>
  isElevatedRole(actorRole) || Boolean(actorId && video.author_id === actorId);

const resolveCreateVisibility = (actorRole, requestedActive) => {
  if (isElevatedRole(actorRole) && requestedActive !== false) {
    return { status: "published", is_active: true };
  }
  return { status: "review", is_active: false };
};

const resolveUpdateVisibility = (actorRole, requestedActive, current) => {
  if (!isElevatedRole(actorRole)) {
    return {
      status: current.status || "review",
      is_active: current.is_active === true,
    };
  }
  if (requestedActive === false) {
    return { status: "review", is_active: false };
  }
  return { status: "published", is_active: true };
};

const buildTranslationValues = (translations, { patch = false } = {}) => {
  const translationValues = {};
  const updatedTranslationFields = [];

  for (const loc of TRANSLATION_LOCALES) {
    const entry = translations?.[loc];
    if (!entry) continue;

    if (!patch || entry.title !== undefined) {
      translationValues[`title_${loc}`] = entry.title ?? null;
      updatedTranslationFields.push(`title_${loc}`);
    }
    if (!patch || entry.description !== undefined) {
      translationValues[`description_${loc}`] = entry.description ?? null;
      updatedTranslationFields.push(`description_${loc}`);
    }
  }

  return { translationValues, updatedTranslationFields };
};

class YoutubeCommandDomain {
  constructor(db) {
    this.db = db;
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async addYoutubeVideo(payload) {
    const { translationValues } = buildTranslationValues(payload.translations);
    const visibility = resolveCreateVisibility(payload.actor_role, payload.is_active);

    const result = await this.command.insertOne({
      id: randomUUID(),
      title: payload.title,
      description: payload.description || null,
      url: payload.url,
      is_active: visibility.is_active,
      author_id: payload.actor_id || null,
      status: visibility.status,
      created_at: new Date(),
      metadata: { ...payload, format: payload.format || (new URL(payload.url).pathname.startsWith("/shorts/") ? "short" : "horizontal") },
      title_en: translationValues.title_en ?? null,
      description_en: translationValues.description_en ?? null,
      title_uz: translationValues.title_uz ?? null,
      description_uz: translationValues.description_uz ?? null,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to add YouTube video"));
    }

    if (!isElevatedRole(payload.actor_role)) {
      void notifyEditorsOfSubmission({
        db: this.db,
        actorId: payload.actor_id,
        actorName: payload.actor_name,
        resourceLabel: "video",
        title: payload.title,
      });
    }

    return wrapper.data(result.rows[0]);
  }

  async updateYoutubeVideo(payload) {
    const current = await this.query.findOneById(payload.id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate YouTube video"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("YouTube video not found"));
    }

    const video = current.rows[0];
    if (!canMutateVideo(video, payload.actor_id, payload.actor_role)) {
      return wrapper.error(new ForbiddenError("You are not allowed to update this video"));
    }

    const visibility = resolveUpdateVisibility(
      payload.actor_role,
      payload.is_active,
      video
    );
    const { translationValues, updatedTranslationFields } = buildTranslationValues(
      payload.translations,
      { patch: true }
    );

    const result = await this.command.updateOne({
      id: payload.id,
      title: payload.title,
      description: payload.description || null,
      url: payload.url,
      is_active: visibility.is_active,
      status: visibility.status,
      translationValues,
      updatedTranslationFields,
      metadata: payload,
    });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to update YouTube video"));
    }
    return wrapper.data(result.rows[0]);
  }

  async deleteYoutubeVideo({ id, actor_id, actor_role }) {
    const current = await this.query.findOneById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate YouTube video"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("YouTube video not found"));
    }

    if (!canMutateVideo(current.rows[0], actor_id, actor_role)) {
      return wrapper.error(new ForbiddenError("You are not allowed to delete this video"));
    }

    const result = await this.command.deleteOne(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to delete YouTube video"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = YoutubeCommandDomain;
