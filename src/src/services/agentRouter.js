import { crawlJobData } from "./crawlerTool";
import { scanCvInput } from "./cvScannerTool";
import { calculateTopMatches } from "./matchingTool";

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function detectAgentIntent(message) {
  const normalizedMessage = normalize(message);
  if (
    ["cap nhat", "crawl", "cao du lieu", "du lieu moi", "jd moi"].some(
      (keyword) => normalizedMessage.includes(keyword),
    )
  ) {
    return "refresh_jobs";
  }
  if (
    ["quét cv", "quet cv", "scan cv", "doc cv", "phan tich cv"].some(
      (keyword) => normalizedMessage.includes(keyword),
    )
  ) {
    return "scan_cv";
  }
  if (
    ["hop voi cv", "phu hop", "top 3", "cong ty nao", "matching"].some(
      (keyword) => normalizedMessage.includes(keyword),
    )
  ) {
    return "match_cv";
  }
  return "career_question";
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
  const intent = detectAgentIntent(message);
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
    message: "Agent đang phân tích yêu cầu của bạn...",
  });

  let jdData = existingJdData;
  let cvData = existingCvData;
  let matchingResult = null;

  if (intent === "refresh_jobs") {
    jdData = await crawlJobData({ onStatus: emit });
    return {
      intent,
      answer: `Đã cập nhật ${jdData.totalJobs} JD mock từ ${jdData.totalCompanies} công ty. Dữ liệu đã được làm sạch và sẵn sàng để matching.`,
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
        : "Chưa tìm thấy kết quả phù hợp trong dữ liệu mock.",
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
  const keyword = normalize(message);
  const relatedJobs = jdData.jobs
    .filter((job) =>
      normalize(
        `${job.companyName} ${job.teamName} ${job.position} ${job.requiredSkills.join(" ")}`,
      ).includes(keyword),
    )
    .slice(0, 3);

  return {
    intent,
    answer: relatedJobs.length
      ? `Mình tìm thấy ${relatedJobs.length} vị trí liên quan trong dữ liệu JD mock: ${relatedJobs.map((job) => `${job.position} tại ${job.companyName}`).join("; ")}.`
      : "Mình có thể cập nhật JD, quét CV hoặc tìm Top 3 công ty phù hợp. Hãy thử: “Tìm công ty hợp với CV của tôi”.",
    toolTrace,
    jdData,
    cvData,
    matches: [],
  };
}
