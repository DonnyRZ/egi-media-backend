const { z } = require("zod");

const localeTranslationSchema = z.object({
  title: z.string(),
  content: z.string(),
});

/**
 * Zod schema for AI article translation output.
 * Matches the CMS auto-translation contract.
 */
const articleTranslationOutputSchema = z.object({
  status: z.enum(["success", "invalid_input", "processing_failed"]),
  result: z.object({
    en: localeTranslationSchema,
    uz: localeTranslationSchema,
  }),
});

/**
 * Strict JSON Schema for OpenAI Responses API `text.format.json_schema`.
 * Mirrors the Zod contract; additionalProperties must stay false.
 */
const ARTICLE_TRANSLATION_JSON_SCHEMA = Object.freeze({
  name: "article_translation_output",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["status", "result"],
    properties: {
      status: {
        type: "string",
        enum: ["success", "invalid_input", "processing_failed"],
      },
      result: {
        type: "object",
        additionalProperties: false,
        required: ["en", "uz"],
        properties: {
          en: {
            type: "object",
            additionalProperties: false,
            required: ["title", "content"],
            properties: {
              title: { type: "string" },
              content: { type: "string" },
            },
          },
          uz: {
            type: "object",
            additionalProperties: false,
            required: ["title", "content"],
            properties: {
              title: { type: "string" },
              content: { type: "string" },
            },
          },
        },
      },
    },
  },
});

/**
 * Extra business-rule check after schema validation.
 * Success responses must contain non-empty title/content per locale.
 */
function isSuccessfulTranslation(parsed) {
  if (parsed.status !== "success") return false;

  const locales = [parsed.result.en, parsed.result.uz];
  return locales.every(
    (locale) => locale.title.trim().length > 0 && locale.content.trim().length > 0,
  );
}

module.exports = {
  articleTranslationOutputSchema,
  ARTICLE_TRANSLATION_JSON_SCHEMA,
  isSuccessfulTranslation,
};
