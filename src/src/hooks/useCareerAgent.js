"use client";

import { useCallback, useRef, useState } from "react";
import { requestCareerAgent } from "../services/careerAgentApi";

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
        const result = await requestCareerAgent(
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
          CV_EMPTY_CONTENT: "Không tìm thấy nội dung trong CV.",
          CV_UNREADABLE_CONTENT:
            "Hệ thống không thể đọc nội dung file này. Vui lòng dùng PDF hoặc DOCX chuẩn.",
          CV_NO_SKILLS_FOUND:
            "CV chưa có kỹ năng đủ rõ để thực hiện đánh giá.",
          GROQ_API_KEY_MISSING:
            "Server chưa có GROQ_API_KEY. Hãy thêm key vào .env.local rồi khởi động lại.",
          GROQ_ACCESS_BLOCKED:
            "Groq đã chặn API access do giới hạn chi tiêu hoặc cấu hình tài khoản.",
          GROQ_AUTHENTICATION_FAILED:
            "Groq từ chối API key. Hãy kiểm tra key còn hiệu lực và thuộc đúng project.",
          GROQ_PERMISSION_DENIED:
            "Project Groq chưa có quyền sử dụng model đã cấu hình.",
          GROQ_MODEL_NOT_AVAILABLE:
            "Model chưa khả dụng. Hãy đổi GROQ_MODEL rồi khởi động lại.",
          GROQ_RATE_LIMITED:
            "Groq đang giới hạn tần suất hoặc token. Vui lòng chờ rồi thử lại.",
          GROQ_REQUEST_TOO_LARGE:
            "Yêu cầu gửi tới Groq quá lớn. Hãy dùng CV ngắn hơn.",
          GROQ_UNPROCESSABLE_OUTPUT:
            "Groq không thể tạo kết quả đúng cấu trúc. Vui lòng thử lại.",
          GROQ_CAPACITY_EXCEEDED:
            "Groq đang hết capacity tạm thời. Vui lòng thử lại sau.",
          GROQ_CONNECTION_ERROR:
            "Server không thể kết nối tới Groq.",
          GROQ_BAD_REQUEST:
            "Groq từ chối cấu trúc request. Hãy kiểm tra model và Structured Output.",
          CV_FILE_TOO_LARGE: "CV vượt quá giới hạn 8 MB.",
          CV_FILE_READ_FAILED: "Không thể đọc file CV đã chọn.",
          CV_FILE_UNSUPPORTED:
            "Groq flow hiện hỗ trợ CV dạng PDF hoặc DOCX. File DOC cũ chưa được hỗ trợ.",
          AGENT_API_ERROR:
            caughtError?.detail ??
            "Không thể kết nối Agent API. Vui lòng thử lại.",
        };
        const errorMessage =
          messageByCode[caughtError?.message] ??
          caughtError?.detail ??
          "Agent API gặp lỗi ngoài dự kiến. Vui lòng thử lại.";
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
