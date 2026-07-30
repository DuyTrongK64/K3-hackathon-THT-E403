export function createAgentRouter({
  detectAgentIntent,
  crawlJobData,
  scanCvInput,
  calculateTopMatches,
  answerCareerQuestion,
  evaluatePreflight,
}) {
  if (
    !detectAgentIntent ||
    !crawlJobData ||
    !scanCvInput ||
    !calculateTopMatches ||
    !answerCareerQuestion
  ) {
    throw new Error("AGENT_DEPENDENCIES_REQUIRED");
  }

  return {
    async process(
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

      const preflight = evaluatePreflight?.(message, cvInput);
      if (preflight) {
        emit({
          tool: "security",
          state: "done",
          message: "Policy Engine đã xử lý yêu cầu trước khi gọi LLM.",
        });
        return {
          ...preflight,
          toolTrace,
          jdData: existingJdData,
          cvData: existingCvData,
          matches: [],
        };
      }

      emit({
        tool: "agent",
        state: "running",
        message: "Agent đang phân tích ý định...",
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

      if (intent === "refresh_jobs") {
        jdData = await crawlJobData({ onStatus: emit });
        return {
          intent,
          answer: `Đã cập nhật ${jdData.totalJobs} JD từ ${jdData.totalCompanies} công ty. Dữ liệu đã được làm sạch và sẵn sàng để matching.`,
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
          answer: `CV Scanner đã nhận diện ${cvData.skills.length} kỹ năng: ${cvData.skills.join(", ")}. Mong muốn chính: ${(cvData.wishes?.targetDomains ?? []).join(", ")}.`,
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
        const matchingResult = await calculateTopMatches(
          { jdData, cvData, limit: 3, question: message },
          { onStatus: emit },
        );
        const bestMatch = matchingResult.matches[0];
        return {
          intent,
          answer: bestMatch
            ? `Agent đề xuất ${bestMatch.companyName} — ${bestMatch.teamName} cho vị trí ${bestMatch.position} với ${bestMatch.score}% phù hợp. ${bestMatch.reasons?.join(" ") ?? ""}`
            : matchingResult.noMatchReason ??
              "Không có công ty hoặc vị trí nào đủ phù hợp trong dữ liệu hiện tại.",
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
      const answer = await answerCareerQuestion({ message, jdData });
      emit({
        tool: "agent",
        state: "done",
        message: "Agent đã hoàn tất câu trả lời.",
      });

      return {
        intent,
        answer,
        toolTrace,
        jdData,
        cvData,
        matches: [],
      };
    },
  };
}

