import { crawlJobData } from "./crawlerTool";
import { scanCvInput } from "./cvScannerTool";
import { calculateTopMatches } from "./matchingTool";
import { createStructuredResponse } from "./openaiClient";

const ROUTER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "needsCv", "needsJd", "rationale"],
  properties: {
    intent: {
      type: "string",
      enum: ["refresh_jobs", "scan_cv", "match_cv", "career_question"],
    },
    needsCv: { type: "boolean" },
    needsJd: { type: "boolean" },
    rationale: { type: "string" },
  },
};

const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer"],
  properties: {
    answer: { type: "string" },
  },
};

export async function detectAgentIntent(message) {
  const result = await createStructuredResponse({
    name: "vincareer_agent_route",
    schema: ROUTER_SCHEMA,
    instructions: `Bạn là router của VinCareer Insight AI.
Chọn đúng một intent:
- refresh_jobs: cập nhật/crawl/tra cứu dữ liệu tuyển dụng mới.
- scan_cv: chỉ đọc, phân tích hoặc tóm tắt CV.
- match_cv: tìm công ty, team, JD hoặc Top 3 phù hợp với CV.
- career_question: hỏi đáp nghề nghiệp, công ty, kỹ năng, phỏng vấn.
Không trả lời câu hỏi ở bước này.`,
    input: message,
    maxOutputTokens: 500,
  });
  return result.data;
}

/**
 * AI Agent trung tâm: phân tích intent và điều phối Tool theo tuần tự.
 */
export async function routeAgentRequest(
  {
    message,
    cvInput = {},
    existingJdData = null,
    existingCvData = null,
  } = {},
  { onStatus } = {},
) {
  if (!String(message).trim()) throw new Error("AGENT_MESSAGE_REQUIRED");
  const toolTrace = [];

  const emit = (step) => {
    const normalizedStep = {
      id: `${step.tool}-${toolTrace.length + 1}`,
      ...step,
    };
    toolTrace.push(normalizedStep);
    onStatus?.(normalizedStep);
  };

  emit({
    tool: "agent",
    state: "running",
    message: "Agent đang phân tích ý định bằng OpenAI...",
  });

  const route = await detectAgentIntent(message);
  const intent = route.intent;
  emit({
    tool: "agent",
    state: "done",
    message: `Agent đã chọn luồng ${intent}: ${route.rationale}`,
  });

  let jdData = existingJdData;
  let cvData = existingCvData;
  let matchingResult = null;

  if (intent === "refresh_jobs") {
    jdData = await crawlJobData({ onStatus: emit });
    return {
      intent,
      answer: `Đã cập nhật ${jdData.totalJobs} JD từ ${jdData.totalCompanies} công ty bằng OpenAI Web Search. Dữ liệu đã được làm sạch và sẵn sàng để matching.`,
      toolTrace,
      jdData,
      cvData,
      matches: [],
    };
  }

  if (intent === "scan_cv") {
    cvData = await scanCvInput(cvInput, { onStatus: emit });
    return {
      intent,
      answer: `CV Scanner đã nhận diện ${cvData.skills.length} kỹ năng: ${cvData.skills.join(", ")}. Mong muốn chính: ${cvData.wishes.targetDomains.join(", ")}.`,
      toolTrace,
      jdData,
      cvData,
      matches: [],
    };
  }

  if (intent === "match_cv") {
    if (!cvData) {
      cvData = await scanCvInput(cvInput, { onStatus: emit });
    }
    if (!jdData) {
      jdData = await crawlJobData({ onStatus: emit });
    }
    matchingResult = await calculateTopMatches(
      { jdData, cvData, limit: 3 },
      { onStatus: emit },
    );
    const bestMatch = matchingResult.matches[0];
    return {
      intent,
      answer: bestMatch
        ? `Agent đề xuất ${bestMatch.companyName} — ${bestMatch.teamName} cho vị trí ${bestMatch.position} với ${bestMatch.score}% phù hợp.`
        : "Chưa tìm thấy kết quả phù hợp trong dữ liệu JD hiện tại.",
      toolTrace,
      jdData,
      cvData,
      matches: matchingResult.matches,
      matchingMeta: matchingResult,
    };
  }

  if (!jdData) {
    jdData = await crawlJobData({ onStatus: emit });
  }
  emit({
    tool: "agent",
    state: "running",
    message: "Agent đang tổng hợp câu trả lời từ dữ liệu JD...",
  });
  const answerResult = await createStructuredResponse({
    name: "vincareer_agent_answer",
    schema: ANSWER_SCHEMA,
    instructions: `Bạn là cố vấn nghề nghiệp VinCareer Insight AI dành cho sinh viên.
Trả lời bằng tiếng Việt, trực tiếp, thực tế và không quá 180 từ.
Chỉ dựa trên JD được cung cấp; nếu dữ liệu chưa đủ phải nói rõ.
Không khẳng định lương, tỷ lệ offer hoặc chính sách nội bộ là dữ liệu chính thức.`,
    input: `Câu hỏi: ${message}\n\nDữ liệu JD:\n${JSON.stringify(
      jdData.jobs.slice(0, 12),
    )}`,
    maxOutputTokens: 1000,
  });
  emit({
    tool: "agent",
    state: "done",
    message: "Agent đã hoàn tất câu trả lời.",
  });

  return {
    intent,
    answer: answerResult.data.answer,
    toolTrace,
    jdData,
    cvData,
    matches: [],
  };
}
