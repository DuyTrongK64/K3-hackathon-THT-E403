import OpenAI from "openai";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "openai/gpt-oss-20b";

let client;

function mapGroqError(error) {
  const providerCode = error?.code ?? error?.error?.code ?? "";
  const providerType = error?.type ?? error?.error?.type ?? "";
  const status = Number(error?.status ?? 0);
  let code = "GROQ_REQUEST_FAILED";

  if (
    providerCode === "blocked_api_access" ||
    providerType === "blocked_api_access"
  ) {
    code = "GROQ_ACCESS_BLOCKED";
  } else if (status === 401 || providerCode === "invalid_api_key") {
    code = "GROQ_AUTHENTICATION_FAILED";
  } else if (status === 403) {
    code = "GROQ_PERMISSION_DENIED";
  } else if (
    providerCode === "model_not_found" ||
    status === 404
  ) {
    code = "GROQ_MODEL_NOT_AVAILABLE";
  } else if (
    status === 429 ||
    providerCode === "rate_limit_exceeded"
  ) {
    code = "GROQ_RATE_LIMITED";
  } else if (status === 413) {
    code = "GROQ_REQUEST_TOO_LARGE";
  } else if (status === 422) {
    code = "GROQ_UNPROCESSABLE_OUTPUT";
  } else if (status === 498) {
    code = "GROQ_CAPACITY_EXCEEDED";
  } else if (
    error?.name === "APIConnectionError" ||
    String(error?.message).includes("Connection error")
  ) {
    code = "GROQ_CONNECTION_ERROR";
  } else if (status === 400) {
    code = "GROQ_BAD_REQUEST";
  }

  const mapped = new Error(code);
  mapped.status = status || null;
  mapped.providerCode = providerCode || null;
  return mapped;
}

export function getGroqClient() {
  if (typeof window !== "undefined") {
    throw new Error("GROQ_SERVER_ONLY");
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY_MISSING");
  }

  client ??= new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
    timeout: 60_000,
    maxRetries: 2,
  });

  return client;
}

export function getGroqModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

export async function createStructuredResponse({
  name,
  schema,
  instructions,
  input,
  tools,
  maxOutputTokens = 3000,
}) {
  const groq = getGroqClient();
  let response;
  try {
    response = await groq.responses.create({
      model: getGroqModel(),
      instructions,
      input,
      ...(tools?.length ? { tools } : {}),
      reasoning: { effort: "low" },
      text: {
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
    throw mapGroqError(error);
  }

  if (!response.output_text?.trim()) {
    throw new Error("GROQ_EMPTY_RESPONSE");
  }

  try {
    return {
      data: JSON.parse(response.output_text),
      usage: response.usage ?? null,
      responseId: response.id,
      model: response.model,
    };
  } catch {
    throw new Error("GROQ_INVALID_JSON");
  }
}
