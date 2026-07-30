const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

const TOKEN_KEY = "vincareer_access_token";

const ERROR_MESSAGES = {
  AUTH_TOKEN_INVALID: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  AUTH_CREDENTIALS_INVALID: "Email hoặc mật khẩu không đúng.",
  ADMIN_ROLE_REQUIRED: "Tài khoản không có quyền quản trị.",
  USER_EMAIL_EXISTS: "Email này đã được đăng ký.",
  PORTFOLIO_NOT_FOUND: "Bạn chưa có Portfolio.",
  PORTFOLIO_ACCESS_DENIED: "Bạn không có quyền xem Portfolio này.",
  COMPANY_NOT_FOUND: "Không tìm thấy công ty.",
  COMPANY_SLUG_EXISTS: "Mã công ty đã tồn tại.",
  INTEREST_LIMIT_REACHED:
    "Bạn chỉ có thể quan tâm tối đa 3 công ty. Hãy bỏ quan tâm một công ty trước.",
  CRITERION_KEY_EXISTS: "Mã tiêu chí đã tồn tại.",
  GROQ_API_KEY_MISSING: "Backend chưa được cấu hình GROQ_API_KEY.",
  CV_EMPTY_CONTENT: "CV không có nội dung.",
  CV_FILE_TOO_LARGE: "CV vượt quá giới hạn 8 MB.",
  CV_FILE_UNSUPPORTED: "Chỉ hỗ trợ CV định dạng PDF hoặc DOCX.",
  CV_FILE_READ_FAILED: "Không thể đọc nội dung CV.",
  CV_UNREADABLE_CONTENT: "CV không có đủ nội dung văn bản để phân tích.",
};

export class ApiError extends Error {
  constructor(message, { code = "API_REQUEST_FAILED", status = 0 } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
  else window.sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  let response;
  const token = getAccessToken();
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Không kết nối được Backend. Hãy kiểm tra FastAPI đang chạy tại cổng 8000.",
    );
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail;
    const code = typeof detail === "string" ? detail : detail?.code;
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("vincareer:unauthorized"));
    }
    throw new ApiError(
      ERROR_MESSAGES[code] ||
        detail?.message ||
        (typeof detail === "string" ? detail : "Yêu cầu API không thành công."),
      { code, status: response.status },
    );
  }
  return payload;
}

const jsonBody = (payload) => JSON.stringify(payload);

export const careerApi = {
  register: (payload) =>
    request("/auth/register", { method: "POST", body: jsonBody(payload) }),
  login: (payload) =>
    request("/auth/login", { method: "POST", body: jsonBody(payload) }),
  me: () => request("/auth/me"),

  listCompanies: ({ includeInactive = false } = {}) =>
    request(`/companies${includeInactive ? "?include_inactive=true" : ""}`),
  getCompany: (id) => request(`/companies/${id}`),
  getCompanyAnalysis: (id) => request(`/companies/${id}/analysis`),
  createCompany: (payload) =>
    request("/companies", { method: "POST", body: jsonBody(payload) }),
  updateCompany: (id, payload) =>
    request(`/companies/${id}`, { method: "PATCH", body: jsonBody(payload) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: "DELETE" }),
  listInterests: () => request("/interests"),
  followCompany: (id) =>
    request(`/interests/${id}`, { method: "POST" }),
  unfollowCompany: (id) =>
    request(`/interests/${id}`, { method: "DELETE" }),

  listCriteria: ({ includeInactive = false } = {}) =>
    request(`/criteria${includeInactive ? "?include_inactive=true" : ""}`),
  createCriterion: (payload) =>
    request("/criteria", { method: "POST", body: jsonBody(payload) }),
  updateCriterion: (id, payload) =>
    request(`/criteria/${id}`, { method: "PATCH", body: jsonBody(payload) }),
  deleteCriterion: (id) => request(`/criteria/${id}`, { method: "DELETE" }),

  getPortfolio: (id) => request(`/portfolios/${id}`),
  getMyLatestPortfolio: () => request("/portfolios/me/latest"),
  getTopMatches: (portfolioId, limit = 3) =>
    request(`/matches/top/${portfolioId}?limit=${limit}`),
  scanCVFile: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/portfolios/scan", { method: "POST", body });
  },
  scanCVText: (text) =>
    request("/portfolios/scan-text", {
      method: "POST",
      body: jsonBody({ text }),
    }),

  chat: ({ message, portfolioId, history }) =>
    request("/agent/chat", {
      method: "POST",
      body: jsonBody({
        message,
        portfolio_id: portfolioId || null,
        history: history
          .slice(-8)
          .map(({ role, content }) => ({ role, content })),
      }),
    }),
};

export { API_BASE_URL };
