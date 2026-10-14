const PROMPT_ID = "category-translation-system";
const PROMPT_VERSION = "1.0.0";

function buildCategoryTranslationPrompt(name, description = "") {
  const input = {
    name: String(name || "").trim(),
    description: String(description || "").trim(),
  };

  return {
    input,
    system: [
      "Translate Indonesian editorial category names and descriptions into English and Uzbek (Latin script).",
      "Use concise, natural language suitable for a news website navigation and category page.",
      "Preserve organization names, acronyms, and proper nouns. Do not add facts or commentary.",
      "When the Indonesian description is empty, return an empty description for both languages.",
      "Return only the requested JSON object.",
    ].join(" "),
    user: JSON.stringify(input),
  };
}

module.exports = { buildCategoryTranslationPrompt, PROMPT_ID, PROMPT_VERSION };
