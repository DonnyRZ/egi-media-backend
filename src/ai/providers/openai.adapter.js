const OpenAI = require("openai");
const config = require("../../config/global_config");
const logger = require("../../helpers/utils/logger");
const {
  ARTICLE_TRANSLATION_JSON_SCHEMA,
} = require("../schemas/article-translation.schema");

const ctx = "AI-OpenAI-Adapter";

let cachedClient = null;
let cachedClientKey = null;

function getAiConfig() {
  return {
    apiKey: config.get("/ai/apiKey"),
    // Kept for env compatibility; Responses API uses the SDK default host.
    baseUrl: (config.get("/ai/baseUrl") || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: config.get("/ai/model") || "gpt-5.6-luna",
    timeoutMs: Number(config.get("/ai/timeoutMs") || 120000),
    maxRetries: Number(config.get("/ai/maxRetries") || 1),
    enabled: String(config.get("/ai/enabled") ?? "true").toLowerCase() !== "false",
  };
}

function getClient(ai) {
  const key = `${ai.apiKey}|${ai.timeoutMs}|${ai.baseUrl}`;
  if (cachedClient && cachedClientKey === key) return cachedClient;

  const options = {
    apiKey: ai.apiKey,
    timeout: ai.timeoutMs,
    // Queue/worker owns retries — match AI app practice.
    maxRetries: 0,
  };
  // Only override baseURL when non-default (OpenAI SDK appends /responses itself).
  if (ai.baseUrl && ai.baseUrl !== "https://api.openai.com/v1") {
    options.baseURL = ai.baseUrl;
  }

  cachedClient = new OpenAI(options);
  cachedClientKey = key;
  return cachedClient;
}

function extractProviderDetails(error) {
  return {
    status: error?.status || error?.response?.status || null,
    errorCode: error?.code || error?.error?.code || null,
    errorType: error?.type || error?.error?.type || null,
    message: typeof error?.message === "string" ? error.message.slice(0, 200) : null,
  };
}

function normalizeProviderError(error) {
  const details = extractProviderDetails(error);
  const status = details.status;
  const message = String(error?.message || "AI provider request failed");

  if (
    error?.name === "APIConnectionTimeoutError" ||
    /timeout/i.test(message) ||
    status === 408
  ) {
    const err = new Error("AI provider timed out");
    err.code = "AI_PROVIDER_TIMEOUT";
    err.retryable = true;
    err.details = details;
    return err;
  }

  if (status === 429) {
    const err = new Error("AI provider rate limited");
    err.code = "AI_PROVIDER_RATE_LIMITED";
    err.retryable = true;
    err.details = details;
    return err;
  }

  if (status === 401 || status === 403) {
    const err = new Error("AI provider authentication failed");
    err.code = "AI_PROVIDER_AUTHENTICATION_FAILED";
    err.retryable = false;
    err.details = details;
    return err;
  }

  if (status >= 500) {
    const err = new Error("AI provider unavailable");
    err.code = "AI_PROVIDER_UNAVAILABLE";
    err.retryable = true;
    err.details = details;
    return err;
  }

  const err = new Error(message.slice(0, 200) || "AI provider request failed");
  err.code = "AI_PROVIDER_ERROR";
  err.retryable = false;
  err.details = details;
  return err;
}

/**
 * Call OpenAI Responses API the same way as egi-media-ai-backend:
 * model + input messages + strict json_schema, no temperature.
 */
async function callOnce({ system, user, requestId }) {
  const ai = getAiConfig();
  const client = getClient(ai);

  const requestBody = {
    model: ai.model,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: ARTICLE_TRANSLATION_JSON_SCHEMA.name,
        strict: true,
        schema: ARTICLE_TRANSLATION_JSON_SCHEMA.schema,
      },
    },
  };

  const response = await client.responses.create(requestBody, {
    timeout: ai.timeoutMs,
    headers: { "X-Client-Request-Id": requestId },
  });

  const rawText = typeof response?.output_text === "string" ? response.output_text.trim() : "";
  if (!rawText) {
    const err = new Error("AI provider returned empty content");
    err.code = "AI_EMPTY_RESPONSE";
    err.retryable = true;
    throw err;
  }

  return {
    rawText,
    model: response?.model || ai.model,
    usage: response?.usage || null,
  };
}

/**
 * Call OpenAI-compatible Responses API with limited retries (retryable errors only).
 */
async function completeChat({ system, user, requestId }) {
  const ai = getAiConfig();
  if (!ai.enabled) {
    const err = new Error("AI translation is disabled");
    err.code = "AI_DISABLED";
    err.retryable = false;
    throw err;
  }
  if (!ai.apiKey) {
    const err = new Error("AI API key is not configured");
    err.code = "AI_NOT_CONFIGURED";
    err.retryable = false;
    throw err;
  }

  let lastError = null;
  const attempts = Math.max(1, ai.maxRetries + 1);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await callOnce({ system, user, requestId });
      return { ...result, attempt };
    } catch (error) {
      const normalized =
        error.code && error.code.startsWith("AI_")
          ? error
          : normalizeProviderError(error);
      lastError = normalized;
      logger.warn(ctx, "completeChat", "AI call attempt failed", {
        requestId,
        attempt,
        code: normalized.code || "AI_CALL_FAILED",
        retryable: Boolean(normalized.retryable),
        status: normalized.details?.status || null,
        errorCode: normalized.details?.errorCode || null,
        errorType: normalized.details?.errorType || null,
      });
      if (!normalized.retryable || attempt >= attempts) break;
    }
  }

  throw lastError;
}

module.exports = {
  completeChat,
  getAiConfig,
};
