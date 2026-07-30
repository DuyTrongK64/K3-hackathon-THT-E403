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
    GROQ_API_KEY_MISSING:
      "Server chưa được cấu hình GROQ_API_KEY.",
    GROQ_EMPTY_RESPONSE: "Groq không trả về nội dung.",
    GROQ_INVALID_JSON: "Groq trả về dữ liệu không đúng cấu trúc.",
    GROQ_ACCESS_BLOCKED:
      "Groq đã chặn API access do giới hạn chi tiêu hoặc cấu hình tài khoản.",
    GROQ_AUTHENTICATION_FAILED:
      "Groq từ chối API key. Hãy kiểm tra key còn hiệu lực và thuộc đúng project.",
    GROQ_PERMISSION_DENIED:
      "Project Groq chưa có quyền sử dụng model đang cấu hình.",
    GROQ_MODEL_NOT_AVAILABLE:
      "Model Groq không tồn tại hoặc chưa khả dụng. Hãy đổi GROQ_MODEL rồi khởi động lại.",
    GROQ_RATE_LIMITED:
      "Groq đang giới hạn tần suất hoặc token. Vui lòng chờ rồi thử lại.",
    GROQ_REQUEST_TOO_LARGE:
      "Yêu cầu gửi tới Groq quá lớn. Hãy dùng CV ngắn hơn.",
    GROQ_UNPROCESSABLE_OUTPUT:
      "Groq không thể tạo kết quả đúng cấu trúc. Vui lòng thử lại.",
    GROQ_CAPACITY_EXCEEDED:
      "Groq đang hết capacity tạm thời. Vui lòng thử lại sau.",
    GROQ_CONNECTION_ERROR:
      "Server không thể kết nối tới Groq. Hãy kiểm tra mạng hoặc proxy.",
    GROQ_BAD_REQUEST:
      "Groq từ chối cấu trúc yêu cầu. Hãy kiểm tra model và Structured Output.",
    GROQ_REQUEST_FAILED:
      "Yêu cầu Groq thất bại. Vui lòng kiểm tra trạng thái dịch vụ và thử lại.",
    CV_INPUT_REQUIRED: "Hãy tải CV hoặc dán nội dung CV trước.",
    AGENT_MESSAGE_REQUIRED: "Vui lòng nhập câu hỏi trước khi gửi.",
  };

  return {
    code,
    message:
      messages[code] ??
      "Không thể hoàn thành yêu cầu với Groq. Hãy kiểm tra API key, model và rate limit.",
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
