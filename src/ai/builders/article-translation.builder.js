const fs = require("fs");
const path = require("path");

const PROMPT_PATH = path.join(
  __dirname,
  "..",
  "prompts",
  "features",
  "article-translation-system.md",
);

const PROMPT_ID = "article-translation-system";
const PROMPT_VERSION = "1.1.0";

/** Hard cap to control cost and provider token limits. */
const MAX_TITLE_CHARS = 500;
const MAX_SUMMARY_CHARS = 2000;
const MAX_CONTENT_CHARS = 40000;

let cachedSystemPrompt = null;

function loadSystemPrompt() {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  cachedSystemPrompt = fs.readFileSync(PROMPT_PATH, "utf8").trim();
  return cachedSystemPrompt;
}

function truncate(value, max) {
  if (typeof value !== "string") return "";
  if (value.length <= max) return value;
  return value.slice(0, max);
}

function sanitizeText(value) {
  if (typeof value !== "string") return "";
  // Strip null bytes / control chars except common whitespace.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/**
 * Build provider-agnostic prompt payload for article translation.
 * Untrusted article text is isolated inside <CONTEXT> delimiters.
 */
function buildArticleTranslationPrompt(titleId, contentId, summaryId = "") {
  const title = truncate(sanitizeText(titleId).trim(), MAX_TITLE_CHARS);
  const summary = truncate(sanitizeText(summaryId).trim(), MAX_SUMMARY_CHARS);
  const content = truncate(sanitizeText(contentId).trim(), MAX_CONTENT_CHARS);

  const system = loadSystemPrompt();

  const user = [
    "Translate the Indonesian article below into English (en) and Uzbek (uz).",
    "Translate title, summary, and content. Return JSON only, matching the required schema.",
    "If <SUMMARY> is empty, return an empty string for summary in both locales.",
    "",
    "<CONTEXT>",
    "<SOURCE_LANGUAGE>id</SOURCE_LANGUAGE>",
    "<TITLE>",
    title,
    "</TITLE>",
    "<SUMMARY>",
    summary,
    "</SUMMARY>",
    "<CONTENT>",
    content,
    "</CONTENT>",
    "</CONTEXT>",
  ].join("\n");

  return {
    system,
    user,
    metadata: {
      promptId: PROMPT_ID,
      promptVersion: PROMPT_VERSION,
      titleLength: title.length,
      summaryLength: summary.length,
      contentLength: content.length,
    },
    input: { title, summary, content },
  };
}

module.exports = {
  buildArticleTranslationPrompt,
  PROMPT_ID,
  PROMPT_VERSION,
  MAX_TITLE_CHARS,
  MAX_SUMMARY_CHARS,
  MAX_CONTENT_CHARS,
};
