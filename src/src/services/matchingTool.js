import { createStructuredResponse } from "./groqClient";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const MATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches", "evaluationSummary", "noMatchReason"],
  properties: {
    evaluationSummary: { type: "string" },
    noMatchReason: { type: ["string", "null"] },
    matches: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "jobId",
          "score",
          "internWishes",
          "employerRequirements",
          "preferredSkills",
          "reasons",
          "matchedSkills",
          "missingSkills",
        ],
        properties: {
          jobId: { type: "string" },
          score: { type: "number" },
          internWishes: { type: "number" },
          employerRequirements: { type: "number" },
          preferredSkills: { type: "number" },
          reasons: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: { type: "string" },
          },
          matchedSkills: {
            type: "array",
            items: { type: "string" },
          },
          missingSkills: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  },
};

/**
 * TOOL 3 — Matching Engine powered by Groq.
 * Điểm chỉ dựa trên mong muốn ứng viên và mức khớp kỹ năng với yêu cầu JD.
 * Lương, trợ cấp, kinh nghiệm và độ cạnh tranh không tham gia xếp hạng.
 */
export async function calculateTopMatches(
  { jdData, cvData, limit = 3 } = {},
  { onStatus } = {},
) {
  if (!jdData?.jobs?.length) throw new Error("JD_DATA_REQUIRED");
  if (!cvData?.skills?.length) throw new Error("CV_DATA_REQUIRED");

  onStatus?.({
    tool: "matching",
    state: "running",
    message: "Matching Engine đang so sánh CV với yêu cầu tuyển dụng...",
  });

  const result = await createStructuredResponse({
    name: "vincareer_top_matches",
    schema: MATCH_SCHEMA,
    instructions: `Bạn là Matching Engine cho chương trình thực tập 6 tuần.
Chọn tối đa Top ${limit} JD phù hợp nhất. Chấm đúng thang 100 theo trọng số:
- Mong muốn thực tập sinh: tối đa 40 điểm.
- Kỹ năng khớp yêu cầu bắt buộc của nhà tuyển dụng: tối đa 50 điểm.
- Kỹ năng ưu tiên: tối đa 10 điểm.
score phải bằng tổng 3 điểm thành phần và nằm trong 0-100.
Không sử dụng mức lương, trợ cấp, số năm kinh nghiệm, tỷ lệ cạnh tranh hoặc mức thân thiện fresher để cộng/trừ điểm.
Không cộng điểm cho kỹ năng không xuất hiện trong CV. Lý do phải nêu rõ mong muốn nào và kỹ năng nào khớp hoặc còn thiếu, bằng tiếng Việt.`,
    input: `CV đã quét:\n${JSON.stringify(
      cvData,
    )}\n\nDanh sách JD đã cập nhật:\n${JSON.stringify(jdData.jobs)}`,
    maxOutputTokens: 3500,
  });

  const jobById = new Map(jdData.jobs.map((job) => [job.id, job]));
  const topMatches = result.data.matches
    .map((match) => {
      const job = jobById.get(match.jobId);
      if (!job) return null;
      const scoreDetail = {
        internWishes: clamp(Math.round(match.internWishes), 0, 40),
        employerRequirements: clamp(
          Math.round(match.employerRequirements),
          0,
          50,
        ),
        preferredSkills: clamp(Math.round(match.preferredSkills), 0, 10),
      };
      const score = clamp(
        Object.values(scoreDetail).reduce((sum, value) => sum + value, 0),
        0,
        100,
      );

      return {
        id: job.id,
        companyId: job.companyId,
        companyName: job.companyName,
        teamId: job.teamId,
        teamName: job.teamName,
        department: job.department,
        position: job.position,
        score,
        scoreDetail,
        reasons: match.reasons,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        sourceJob: job,
      };
    })
    .filter(Boolean)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map((match, index) => ({ ...match, rank: index + 1 }));

  onStatus?.({
    tool: "matching",
    state: "done",
    message: `Đã xếp hạng Top ${topMatches.length} cơ hội phù hợp nhất.`,
  });

  return {
    matches: topMatches,
    noMatchReason:
      result.data.noMatchReason ??
      (topMatches.length
        ? null
        : "Không có công ty hoặc vị trí nào phù hợp với kỹ năng trong dữ liệu hiện tại."),
    evaluatedJobs: jdData.jobs.length,
    weights: {
      internWishes: 0.4,
      employerRequirements: 0.5,
      preferredSkills: 0.1,
    },
    evaluationSummary: result.data.evaluationSummary,
    apiUsage: result.usage,
    model: result.model,
    isMock: false,
  };
}
