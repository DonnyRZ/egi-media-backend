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
  isSuccessfulTranslation,
};
