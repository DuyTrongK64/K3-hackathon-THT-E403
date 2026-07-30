import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-5.6-luna";

let client;

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
  const response = await openai.responses.create({
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

