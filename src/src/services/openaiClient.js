import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-5.6-luna";

let client;

function mapOpenAIError(error) {
  const providerCode = error?.code ?? error?.error?.code ?? "";
  const providerType = error?.type ?? error?.error?.type ?? "";
  const status = Number(error?.status ?? 0);
  let code = "OPENAI_REQUEST_FAILED";

  if (
    providerCode === "insufficient_quota" ||
    providerType === "insufficient_quota" ||
    [
      "credit_balance_exhausted",
      "organization_spend_limit_exceeded",
      "project_spend_limit_exceeded",
      "organization_usage_limit_exceeded",
    ].includes(providerCode)
  ) {
    code = "OPENAI_INSUFFICIENT_QUOTA";
  } else if (status === 401 || providerCode === "invalid_api_key") {
    code = "OPENAI_AUTHENTICATION_FAILED";
  } else if (
    providerCode === "model_not_found" ||
    status === 404
  ) {
    code = "OPENAI_MODEL_NOT_AVAILABLE";
  } else if (
    status === 429 ||
    providerCode === "rate_limit_exceeded"
  ) {
    code = "OPENAI_RATE_LIMITED";
  } else if (
    error?.name === "APIConnectionError" ||
    String(error?.message).includes("Connection error")
  ) {
    code = "OPENAI_CONNECTION_ERROR";
  } else if (status === 400) {
    code = "OPENAI_BAD_REQUEST";
  }

  const mapped = new Error(code);
  mapped.status = status || null;
  mapped.providerCode = providerCode || null;
  return mapped;
}

export function getOpenAIClient() {
  if (typeof window !== "undefined") {
    throw new Error("OPENAI_SERVER_ONLY");
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  client ??= new OpenAI({
    apiKey,
    timeout: 60_000,
    maxRetries: 2,
  });

  return client;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export async function createStructuredResponse({
  name,
  schema,
  instructions,
  input,
  tools,
  maxOutputTokens = 3000,
}) {
  const openai = getOpenAIClient();
  let response;
  try {
    response = await openai.responses.create({
      model: getOpenAIModel(),
      instructions,
      input,
      tools,
      reasoning: { effort: "low" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema,
        },
      },
      max_output_tokens: maxOutputTokens,
      store: false,
    });
  } catch (error) {
    throw mapOpenAIError(error);
  }

  if (!response.output_text?.trim()) {
    throw new Error("OPENAI_EMPTY_RESPONSE");
  }

  try {
    return {
      data: JSON.parse(response.output_text),
      usage: response.usage ?? null,
      responseId: response.id,
      model: response.model,
    };
  } catch {
    throw new Error("OPENAI_INVALID_JSON");
  }
}
