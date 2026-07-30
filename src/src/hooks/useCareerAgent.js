"use client";

import { useCallback, useRef, useState } from "react";
import { routeAgentRequest } from "../services/agentRouter";

export function useCareerAgent() {
  const [isRunning, setIsRunning] = useState(false);
  const [agentSteps, setAgentSteps] = useState([]);
  const [jdData, setJdData] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  const [error, setError] = useState("");
  const runningRef = useRef(false);

  const runAgent = useCallback(
    async (message, { cvInput = {}, resetSteps = true } = {}) => {
      if (runningRef.current) return null;
      if (!String(message).trim()) {
        setError("Vui lòng nhập yêu cầu trước khi gọi Agent.");
        return null;
      }

      runningRef.current = true;
      setIsRunning(true);
      setError("");
      if (resetSteps) setAgentSteps([]);

      try {
        const result = await routeAgentRequest(
          {
            message,
            cvInput,
            existingJdData: jdData,
            existingCvData: cvData,
          },
          {
            onStatus: (step) =>
              setAgentSteps((current) => [...current, step]),
          },
        );
        setJdData(result.jdData ?? jdData);
        setCvData(result.cvData ?? cvData);
        setMatches(result.matches ?? []);
        setLastResponse(result);
        return result;
      } catch (caughtError) {
        const messageByCode = {
          CV_INPUT_REQUIRED:
            "Hãy tải CV hoặc dán nội dung CV trước khi yêu cầu Agent matching.",
          JD_DATA_REQUIRED: "Chưa có dữ liệu JD để thực hiện matching.",
          CV_DATA_REQUIRED: "CV chưa có dữ liệu kỹ năng hợp lệ.",
        };
        const errorMessage =
          messageByCode[caughtError?.message] ??
          "Agent gặp lỗi mock ngoài dự kiến. Vui lòng thử lại.";
        setError(errorMessage);
        return {
          intent: "error",
          answer: errorMessage,
          matches: [],
          toolTrace: [],
        };
      } finally {
        runningRef.current = false;
        setIsRunning(false);
      }
    },
    [cvData, jdData],
  );

  const analyzeCv = useCallback(
    (cvInput) =>
      runAgent("Tìm Top 3 công ty phù hợp với CV của tôi", { cvInput }),
    [runAgent],
  );

  const refreshJobs = useCallback(
    () => runAgent("Cập nhật dữ liệu công ty mới nhất"),
    [runAgent],
  );

  const resetAgent = useCallback(() => {
    if (runningRef.current) return;
    setAgentSteps([]);
    setMatches([]);
    setLastResponse(null);
    setError("");
  }, []);

  return {
    isRunning,
    agentSteps,
    jdData,
    cvData,
    matches,
    lastResponse,
    error,
    runAgent,
    analyzeCv,
    refreshJobs,
    resetAgent,
  };
}
