const { z } = require("zod");

const categoryLocaleSchema = z.object({
  name: z.string().max(100),
  description: z.string(),
});

const categoryTranslationOutputSchema = z.object({
  status: z.enum(["success", "invalid_input", "processing_failed"]),
  result: z.object({
    en: categoryLocaleSchema,
    uz: categoryLocaleSchema,
  }),
});

const CATEGORY_TRANSLATION_JSON_SCHEMA = Object.freeze({
  name: "category_translation_output",
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
            required: ["name", "description"],
            properties: { name: { type: "string" }, description: { type: "string" } },
          },
          uz: {
            type: "object",
            additionalProperties: false,
            required: ["name", "description"],
            properties: { name: { type: "string" }, description: { type: "string" } },
          },
        },
      },
    },
  },
});

function isSuccessfulCategoryTranslation(parsed, source) {
  if (parsed.status !== "success") return false;
  return ["en", "uz"].every((locale) => {
    const translated = parsed.result[locale];
    return Boolean(
      translated.name.trim() &&
        (!String(source.description || "").trim() || translated.description.trim()),
    );
  });
}

module.exports = {
  categoryTranslationOutputSchema,
  CATEGORY_TRANSLATION_JSON_SCHEMA,
  isSuccessfulCategoryTranslation,
};
