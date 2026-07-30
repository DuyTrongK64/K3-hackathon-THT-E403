import { routeAgentRequest } from "../../../src/services/agentRouter";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function toEvent(payload: unknown) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

function publicError(error: unknown) {
  const code =
    error instanceof Error ? error.message : "AGENT_API_UNEXPECTED_ERROR";
  const messages: Record<string, string> = {
    OPENAI_API_KEY_MISSING:
      "Server chưa được cấu hình OPENAI_API_KEY.",
    OPENAI_EMPTY_RESPONSE: "OpenAI không trả về nội dung.",
    OPENAI_INVALID_JSON: "OpenAI trả về dữ liệu không đúng cấu trúc.",
    OPENAI_MATCHES_EMPTY: "Matching Engine chưa tạo được kết quả hợp lệ.",
    CV_INPUT_REQUIRED: "Hãy tải CV hoặc dán nội dung CV trước.",
    AGENT_MESSAGE_REQUIRED: "Vui lòng nhập câu hỏi trước khi gửi.",
  };

  return {
    code,
    message:
      messages[code] ??
      "Không thể hoàn thành yêu cầu với OpenAI. Hãy kiểm tra API key, quota và thử lại.",
  };
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "INVALID_JSON_BODY" },
      { status: 400 },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await routeAgentRequest(
          payload,
          {
            onStatus: (step: unknown) =>
              controller.enqueue(toEvent({ type: "status", step })),
          },
        );
        controller.enqueue(toEvent({ type: "result", result }));
      } catch (error) {
        controller.enqueue(
          toEvent({ type: "error", ...publicError(error) }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

