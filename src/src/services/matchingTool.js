import { createStructuredResponse } from "./openaiClient";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const MATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches", "evaluationSummary"],
  properties: {
    evaluationSummary: { type: "string" },
    matches: {
      type: "array",
      minItems: 1,
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
          "experience",
          "fresherEnvironment",
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
          experience: { type: "number" },
          fresherEnvironment: { type: "number" },
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
 * TOOL 3 — Matching Engine powered by OpenAI.
 * Trọng số cao nhất thuộc về mong muốn thực tập sinh (42%)
 * và kỹ năng/yêu cầu bắt buộc của nhà tuyển dụng (38%).
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
- Mong muốn thực tập sinh: tối đa 42 điểm.
- Yêu cầu bắt buộc nhà tuyển dụng: tối đa 38 điểm.
- Kỹ năng ưu tiên: tối đa 10 điểm.
- Kinh nghiệm: tối đa 7 điểm.
- Mức thân thiện fresher: tối đa 3 điểm.
score phải bằng tổng 5 điểm thành phần và nằm trong 0-100.
Không cộng điểm cho kỹ năng không xuất hiện trong CV. Lý do phải cụ thể, bằng tiếng Việt.`,
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
        internWishes: clamp(Math.round(match.internWishes), 0, 42),
        employerRequirements: clamp(
          Math.round(match.employerRequirements),
          0,
          38,
        ),
        preferredSkills: clamp(Math.round(match.preferredSkills), 0, 10),
        experience: clamp(Math.round(match.experience), 0, 7),
        fresherEnvironment: clamp(
          Math.round(match.fresherEnvironment),
          0,
          3,
        ),
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

  if (!topMatches.length) {
    throw new Error("OPENAI_MATCHES_EMPTY");
  }

  onStatus?.({
    tool: "matching",
    state: "done",
    message: `Đã xếp hạng Top ${topMatches.length} cơ hội phù hợp nhất.`,
  });

  return {
    matches: topMatches,
    evaluatedJobs: ranked.length,
    weights: {
      internWishes: 0.42,
      employerRequirements: 0.38,
      preferredSkills: 0.1,
      experience: 0.07,
      fresherEnvironment: 0.03,
    },
    evaluationSummary: result.data.evaluationSummary,
    apiUsage: result.usage,
    model: result.model,
    isMock: false,
  };
}
