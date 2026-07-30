const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

const ERROR_MESSAGES = {
  GROQ_API_KEY_MISSING: "Backend chưa được cấu hình GROQ_API_KEY.",
  CV_EMPTY_CONTENT: "CV không có nội dung.",
  CV_FILE_TOO_LARGE: "CV vượt quá giới hạn 8 MB.",
  CV_FILE_UNSUPPORTED: "Chỉ hỗ trợ CV định dạng PDF hoặc DOCX.",
  CV_FILE_READ_FAILED: "Không thể đọc nội dung CV.",
  CV_UNREADABLE_CONTENT: "CV không có đủ nội dung văn bản để phân tích.",
};

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Không kết nối được Backend. Hãy kiểm tra FastAPI đang chạy tại cổng 8000.",
    );
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail;
    const code = typeof detail === "string" ? detail : detail?.code;
    throw new Error(
      ERROR_MESSAGES[code] ||
        detail?.message ||
        (typeof detail === "string" ? detail : "Yêu cầu API không thành công."),
    );
  }
  return payload;
}

export const careerApi = {
  listCompanies: () => request("/companies"),
  listCriteria: () => request("/criteria"),
  getPortfolio: (id) => request(`/portfolios/${id}`),
  scanCVFile: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/portfolios/scan", { method: "POST", body });
  },
  scanCVText: (text) =>
    request("/portfolios/scan-text", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  chat: ({ message, portfolioId, history }) =>
    request("/agent/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        portfolio_id: portfolioId || null,
        history: history
          .slice(-8)
          .map(({ role, content }) => ({ role, content })),
      }),
    }),
};

export { API_BASE_URL };
