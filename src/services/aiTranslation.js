const { v4: uuidv4 } = require("uuid");
const logger = require("../helpers/utils/logger");
const {
  buildArticleTranslationPrompt,
  PROMPT_ID,
  PROMPT_VERSION,
} = require("../ai/builders/article-translation.builder");
const {
  articleTranslationOutputSchema,
  isSuccessfulTranslation,
} = require("../ai/schemas/article-translation.schema");
const { completeChat } = require("../ai/providers/openai.adapter");

const ctx = "AI-Translation-Service";

function emptyResult() {
  return {
    en: { title: "", content: "" },
    uz: { title: "", content: "" },
  };
}

function safeLogError(requestId, code, message, extra = {}) {
  logger.error(ctx, "translateArticle", message, {
    requestId,
    code,
    promptId: PROMPT_ID,
    promptVersion: PROMPT_VERSION,
    // Never log API keys, system prompt, or full article body.
    ...extra,
  });
}

function parseAndValidate(rawText) {
  let parsedJson;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      value: {
        status: "processing_failed",
        result: emptyResult(),
      },
      code: "AI_OUTPUT_INVALID_JSON",
    };
  }

  const validated = articleTranslationOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      ok: false,
      value: {
        status: "processing_failed",
        result: emptyResult(),
      },
      code: "AI_OUTPUT_SCHEMA_INVALID",
    };
  }

  if (!isSuccessfulTranslation(validated.data)) {
    return {
      ok: false,
      value: validated.data,
      code:
        validated.data.status === "invalid_input"
          ? "AI_INVALID_INPUT"
          : "AI_TRANSLATION_NOT_SUCCESS",
    };
  }

  return { ok: true, value: validated.data, code: null };
}

/**
 * Translate Indonesian article title/content to English and Uzbek.
 * Called by article domain only when status is published/scheduled (final content).
 * Prompt assembly, provider call, and Zod validation all run on the backend.
 *
 * @param {string} titleId
 * @param {string} contentId
 * @returns {Promise<{
 *   status: "success" | "invalid_input" | "processing_failed",
 *   result: { en: { title: string, content: string }, uz: { title: string, content: string } },
 *   meta?: { requestId: string, promptId: string, promptVersion: string }
 * }>}
 */
async function translateArticle(titleId, contentId) {
  const requestId = uuidv4();
  const built = buildArticleTranslationPrompt(titleId, contentId);

  if (!built.input.title || !built.input.content) {
    logger.warn(ctx, "translateArticle", "Rejected empty translation input", {
      requestId,
      code: "AI_INVALID_INPUT",
      titleLength: built.input.title.length,
      contentLength: built.input.content.length,
    });
    return {
      status: "invalid_input",
      result: emptyResult(),
      meta: {
        requestId,
        promptId: PROMPT_ID,
        promptVersion: PROMPT_VERSION,
      },
    };
  }

  try {
    const completion = await completeChat({
      system: built.system,
      user: built.user,
      requestId,
    });

    const validated = parseAndValidate(completion.rawText);
    if (!validated.ok) {
      safeLogError(requestId, validated.code, "AI translation output validation failed", {
        model: completion.model || null,
        attempt: completion.attempt || null,
        status: validated.value.status,
      });
      return {
        ...validated.value,
        meta: {
          requestId,
          promptId: PROMPT_ID,
          promptVersion: PROMPT_VERSION,
        },
      };
    }

    logger.info(ctx, "translateArticle", "Article translation succeeded", {
      requestId,
      promptId: PROMPT_ID,
      promptVersion: PROMPT_VERSION,
      model: completion.model || null,
      attempt: completion.attempt || null,
      usage: completion.usage || null,
    });

    return {
      ...validated.value,
      meta: {
        requestId,
        promptId: PROMPT_ID,
        promptVersion: PROMPT_VERSION,
      },
    };
  } catch (error) {
    safeLogError(requestId, error.code || "AI_PROCESSING_FAILED", "Article translation failed", {
      retryable: Boolean(error.retryable),
    });
    return {
      status: "processing_failed",
      result: emptyResult(),
      meta: {
        requestId,
        promptId: PROMPT_ID,
        promptVersion: PROMPT_VERSION,
      },
    };
  }
}

module.exports = {
  translateArticle,
};
