const { randomUUID } = require("crypto");
const logger = require("../helpers/utils/logger");
const { buildCategoryTranslationPrompt, PROMPT_ID, PROMPT_VERSION } = require("../ai/builders/category-translation.builder");
const {
  categoryTranslationOutputSchema,
  CATEGORY_TRANSLATION_JSON_SCHEMA,
  isSuccessfulCategoryTranslation,
} = require("../ai/schemas/category-translation.schema");
const { completeChat } = require("../ai/providers/openai.adapter");

const ctx = "AI-Category-Translation-Service";

function emptyResult() {
  return { en: { name: "", description: "" }, uz: { name: "", description: "" } };
}

async function translateCategory(name, description = "") {
  const requestId = randomUUID();
  const built = buildCategoryTranslationPrompt(name, description);
  if (!built.input.name) {
    return { status: "invalid_input", result: emptyResult(), meta: { requestId, promptId: PROMPT_ID, promptVersion: PROMPT_VERSION } };
  }

  try {
    const completion = await completeChat({
      system: built.system,
      user: built.user,
      requestId,
      schema: CATEGORY_TRANSLATION_JSON_SCHEMA,
    });
    const parsed = categoryTranslationOutputSchema.safeParse(JSON.parse(completion.rawText));
    if (!parsed.success || !isSuccessfulCategoryTranslation(parsed.data, built.input)) {
      return { status: "processing_failed", result: emptyResult(), meta: { requestId, promptId: PROMPT_ID, promptVersion: PROMPT_VERSION } };
    }
    logger.info(ctx, "translateCategory", "Category translation succeeded", {
      requestId,
      promptId: PROMPT_ID,
      promptVersion: PROMPT_VERSION,
      model: completion.model || null,
      attempt: completion.attempt || null,
      usage: completion.usage || null,
    });
    return { ...parsed.data, meta: { requestId, promptId: PROMPT_ID, promptVersion: PROMPT_VERSION } };
  } catch (error) {
    logger.error(ctx, "translateCategory", "Category translation failed", {
      requestId,
      code: error.code || "AI_TRANSLATION_FAILED",
      retryable: Boolean(error.retryable),
    });
    return {
      status: "processing_failed",
      result: emptyResult(),
      meta: { requestId, promptId: PROMPT_ID, promptVersion: PROMPT_VERSION, error: error.code || "AI translation failed" },
    };
  }
}

module.exports = { translateCategory };
