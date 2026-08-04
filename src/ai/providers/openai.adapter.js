const axios = require("axios");
const config = require("../../config/global_config");
const logger = require("../../helpers/utils/logger");

const ctx = "AI-OpenAI-Adapter";

function getAiConfig() {
  return {
    apiKey: config.get("/ai/apiKey"),
    baseUrl: (config.get("/ai/baseUrl") || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: config.get("/ai/model") || "gpt-4o-mini",
    timeoutMs: Number(config.get("/ai/timeoutMs") || 60000),
    maxRetries: Number(config.get("/ai/maxRetries") || 1),
    enabled: String(config.get("/ai/enabled") ?? "true").toLowerCase() !== "false",
  };
}

function extractJsonText(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

async function callOnce({ system, user, requestId }) {
  const ai = getAiConfig();
  const url = `${ai.baseUrl}/chat/completions`;

  const response = await axios.post(
    url,
    {
      model: ai.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    {
      timeout: ai.timeoutMs,
      headers: {
        Authorization: `Bearer ${ai.apiKey}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    },
  );

  if (response.status < 200 || response.status >= 300) {
    logger.warn(ctx, "callOnce", "Provider returned non-2xx", {
      requestId,
      status: response.status,
      // Never log api key or full prompt body.
      errorCode: response.data?.error?.code || null,
      errorType: response.data?.error?.type || null,
    });
    const err = new Error("AI provider request failed");
    err.code = "AI_PROVIDER_ERROR";
    err.retryable = response.status === 429 || response.status >= 500;
    throw err;
  }

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("AI provider returned empty content");
    err.code = "AI_EMPTY_RESPONSE";
    err.retryable = true;
    throw err;
  }

  return {
    rawText: extractJsonText(content),
    model: response.data?.model || ai.model,
    usage: response.data?.usage || null,
  };
}

/**
 * Call an OpenAI-compatible chat completions endpoint with limited retries.
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
      lastError = error;
      const retryable = Boolean(error.retryable);
      logger.warn(ctx, "completeChat", "AI call attempt failed", {
        requestId,
        attempt,
        code: error.code || "AI_CALL_FAILED",
        retryable,
      });
      if (!retryable || attempt >= attempts) break;
    }
  }

  throw lastError;
}

module.exports = {
  completeChat,
  getAiConfig,
  extractJsonText,
};
