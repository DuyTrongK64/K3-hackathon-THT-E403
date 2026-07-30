import { crawlJobData } from "./crawlerTool";
import { scanCvInput } from "./cvScannerTool";
import { calculateTopMatches } from "./matchingTool";
import { createStructuredResponse } from "./openaiClient";
import { createAgentRouter } from "./agentRouterCore";
import {
  createGroundedCareerAnswer,
  evaluateAgentPreflight,
} from "./agentSafetyPolicy";

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

async function answerCareerQuestion({ message, jdData }) {
  const groundedAnswer = createGroundedCareerAnswer(message, jdData);
  if (groundedAnswer) return groundedAnswer;

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
  return answerResult.data.answer;
}

export const agentRouter = createAgentRouter({
  detectAgentIntent,
  crawlJobData,
  scanCvInput,
  calculateTopMatches,
  answerCareerQuestion,
  evaluatePreflight: evaluateAgentPreflight,
});

export const routeAgentRequest = agentRouter.process;
