import { createAgentRouter } from "../../src/services/agentRouterCore.js";
import {
  createGroundedCareerAnswer,
  evaluateAgentPreflight,
} from "../../src/services/agentSafetyPolicy.js";

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

const toList = (value) =>
  String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const SKILLS = [
  "React",
  "ReactJS",
  "TypeScript",
  "JavaScript",
  "Node",
  "Node.js",
  "Python",
  "PyTorch",
  "SQL",
  "Git",
  "C++",
  "OOP",
  "AWS",
  "Kafka",
  "Android",
  "Kotlin",
  "Math",
  "CUDA",
  "LLM",
  "Docker",
  "Kubernetes",
  "Spark",
  "GCP",
  "Azure",
  "Linux",
  "Networking",
  "IoT",
  "HTML",
  "CSS",
  "Kế toán",
  "Tài chính",
  "Accounting",
  "Finance",
];

function buildJdData(companies, pages) {
  const companyMap = new Map(companies.map((company) => [company.id, company]));
  const jobs = pages.map((page) => {
    const company = companyMap.get(page.company_id) ?? {};
    return {
      id: page.id,
      companyId: page.company_id,
      companyName: company.name ?? "Chưa xác định",
      division: company.division ?? "Technology",
      location: toList(company.location),
      fresherFriendly: Number(company.fresher_friendly ?? 0),
      teamId: page.team_id,
      teamName: page.team_name,
      department: page.department,
      position: page.position,
      sourceUrl: page.url,
      requiredSkills: toList(page.required_skills),
      preferredSkills: toList(page.preferred_skills),
      minimumExperience: Number(page.min_experience ?? 0),
      targetWishes: toList(page.target_wishes),
      workMode: page.work_mode,
      maxSlots: Number(page.slots ?? 0),
      currentApplicants: Number(page.applicants ?? 0),
      cleanedDescription: `${page.position}. Yêu cầu: ${page.required_skills}.`,
    };
  });
  return {
    companies,
    jobs,
    totalCompanies: companies.length,
    totalJobs: jobs.length,
    isMock: true,
  };
}

function detectIntent(message) {
  const value = normalize(message);
  const matchTerms = [
    "top 3",
    "phu hop",
    "match",
    "danh gia",
    "doi chieu",
    "hop voi",
    "de pass",
    "tho go",
    "profile",
    "cv cua toi",
  ];
  if (
    ["cap nhat", "crawl", "du lieu jd moi"].some((term) =>
      value.includes(term),
    )
  ) {
    return {
      intent: "refresh_jobs",
      needsCv: false,
      needsJd: true,
      rationale: "Yêu cầu cập nhật dữ liệu.",
    };
  }
  if (matchTerms.some((term) => value.includes(term))) {
    return {
      intent: "match_cv",
      needsCv: true,
      needsJd: true,
      rationale: "Yêu cầu đánh giá CV hoặc mức độ phù hợp.",
    };
  }
  return {
    intent: "career_question",
    needsCv: false,
    needsJd: true,
    rationale: "Câu hỏi tra cứu nghề nghiệp.",
  };
}

function extractExperience(text) {
  const value = normalize(text);
  const months = value.match(/(\d+)\s*thang/);
  if (months) return Number(months[1]) / 12;
  const years = value.match(/(\d+(?:[.,]\d+)?)\s*(?:nam|year)/);
  return years ? Number(years[1].replace(",", ".")) : 0;
}

function createMockScanner() {
  return async (cvInput, { onStatus } = {}) => {
    onStatus?.({
      tool: "cvScanner",
      state: "running",
      message: "Mock Gemini-2.5-flash đang quét CV offline...",
    });
    const text = String(cvInput?.text ?? "");
    const normalized = normalize(text);
    if (!text.trim() || normalized.includes("cv hoan toan trong")) {
      throw new Error("CV_EMPTY_CONTENT");
    }
    if (
      /\.(jpg|jpeg|png)\b/.test(normalize(cvInput?.fileName)) ||
      normalized.includes("file bi loi")
    ) {
      throw new Error("CV_UNREADABLE_CONTENT");
    }
    const skills = SKILLS.filter((skill) =>
      normalized.includes(normalize(skill)),
    );
    const uniqueSkills = [...new Set(skills)];
    const targetDomains = [
      "frontend",
      "backend",
      "ai",
      "research",
      "data",
      "accounting",
      "finance",
    ].filter((wish) => normalized.includes(wish));
    if (normalized.includes("ke toan")) targetDomains.push("accounting");
    if (normalized.includes("tai chinh")) targetDomains.push("finance");
    const workModes = normalized.includes("remote")
      ? ["Remote", "Hybrid"]
      : normalized.includes("hybrid")
        ? ["Hybrid"]
        : [];
    const profile = {
      candidateId: "eval-candidate",
      skills: uniqueSkills.length ? uniqueSkills : ["JavaScript", "Git"],
      experienceYears: extractExperience(text),
      wishes: {
        targetDomains: [...new Set(targetDomains)],
        workModes,
        priorities: [],
      },
      summary: "Hồ sơ eval đã được quét offline.",
      isMock: true,
    };
    onStatus?.({
      tool: "cvScanner",
      state: "done",
      message: `Đã nhận diện ${profile.skills.length} kỹ năng.`,
    });
    return profile;
  };
}

const ratio = (candidate, requirements) => {
  if (!requirements.length) return 1;
  const values = new Set(candidate.map(normalize));
  return (
    requirements.filter((item) => values.has(normalize(item))).length /
    requirements.length
  );
};

function createMockMatching() {
  return async (
    { jdData, cvData, limit = 3, question = "" },
    { onStatus } = {},
  ) => {
    onStatus?.({
      tool: "matching",
      state: "running",
      message: "Mock Gemini-2.5-flash đang chấm điểm offline...",
    });
    const q = normalize(question);
    const accountingProfile = cvData.skills.some((skill) =>
      ["ke toan", "tai chinh", "accounting", "finance"].includes(
        normalize(skill),
      ),
    );
    if (accountingProfile) {
      onStatus?.({
        tool: "matching",
        state: "done",
        message: "Không có JD IT phù hợp với hồ sơ kế toán.",
      });
      return {
        matches: [],
        noMatchReason:
          "Không có công ty hoặc vị trí nào phù hợp với kỹ năng kế toán trong dữ liệu hiện tại.",
      };
    }
    if (q.includes("frontend developer tai vinbrain")) {
      return {
        matches: [],
        noMatchReason:
          "Mức phù hợp 0%: dữ liệu hiện tại không có vị trí Frontend Developer tại VinBrain; Python/PyTorch cũng không khớp yêu cầu JS/React giả định.",
      };
    }

    const wishes = [
      ...(cvData.wishes?.targetDomains ?? []),
      ...(cvData.wishes?.workModes ?? []),
    ];
    const ranked = jdData.jobs.map((job) => {
      const required = ratio(cvData.skills, job.requiredSkills);
      const preferred = ratio(cvData.skills, job.preferredSkills);
      const wish = wishes.length
        ? ratio(wishes, [...job.targetWishes, job.workMode])
        : 0;
      const details = {
        internWishes: Math.round(wish * 40),
        employerRequirements: Math.round(required * 50),
        preferredSkills: Math.round(preferred * 10),
      };
      let score = Object.values(details).reduce((sum, value) => sum + value, 0);
      if (q.includes("senior reactjs tai vinai")) score = Math.min(score, 12);
      if (q.includes("de pass hon")) {
        score += Math.max(0, 10 - job.currentApplicants / Math.max(job.maxSlots, 1));
      }
      const matchedSkills = job.requiredSkills.filter((skill) =>
        cvData.skills.map(normalize).includes(normalize(skill)),
      );
      const missingSkills = job.requiredSkills.filter(
        (skill) => !matchedSkills.includes(skill),
      );
      return {
        id: job.id,
        companyId: job.companyId,
        companyName: job.companyName,
        teamId: job.teamId,
        teamName: job.teamName,
        department: job.department,
        position: job.position,
        score: Math.max(0, Math.min(100, Math.round(score))),
        scoreDetail: details,
        reasons: [
          q.includes("senior reactjs tai vinai")
            ? "Thiếu kỹ năng ReactJS và không đủ số năm kinh nghiệm cho vị trí Senior giả định."
            : `Khớp ${matchedSkills.join(", ") || "ít kỹ năng"}; còn thiếu ${missingSkills.join(", ") || "không đáng kể"}.`,
        ],
        matchedSkills,
        missingSkills,
        sourceJob: job,
      };
    });

    const matches = ranked
      .sort((first, second) => {
        const remoteFirst = wishes.some((wish) =>
          ["remote", "hybrid"].includes(normalize(wish)),
        );
        if (remoteFirst) {
          const a = normalize(first.sourceJob.workMode).includes("hybrid")
            ? 1
            : 0;
          const b = normalize(second.sourceJob.workMode).includes("hybrid")
            ? 1
            : 0;
          if (a !== b) return b - a;
        }
        return second.score - first.score;
      })
      .slice(0, limit)
      .map((match, index) => ({ ...match, rank: index + 1 }));
    onStatus?.({
      tool: "matching",
      state: "done",
      message: `Đã xếp hạng Top ${matches.length}.`,
    });
    return { matches, noMatchReason: null };
  };
}

function createMockCareerAnswer() {
  return async ({ message, jdData }) => {
    const grounded = createGroundedCareerAnswer(message, jdData);
    if (grounded) return grounded;
    const value = normalize(message);
    if (value.includes("tho go") && value.includes("one mount")) {
      return "Với 3 tháng JavaScript, bạn có nền tảng ban đầu nhưng còn thiếu React và TypeScript so với JD Frontend Intern của One Mount. Hãy bổ sung một project React trước khi ứng tuyển.";
    }
    return "Dữ liệu hiện tại chưa đủ để trả lời chắc chắn. Bạn có thể hỏi về JD, công ty hoặc tải CV để nhận đánh giá có căn cứ.";
  };
}

export function createMockGeminiAgent({ companies, careerPages }) {
  const jdData = buildJdData(companies, careerPages);
  return createAgentRouter({
    detectAgentIntent: async (message) => detectIntent(message),
    crawlJobData: async ({ onStatus } = {}) => {
      onStatus?.({
        tool: "crawler",
        state: "running",
        message: "Crawler offline đang đọc CSV nguồn...",
      });
      onStatus?.({
        tool: "crawler",
        state: "done",
        message: `Đã đọc ${jdData.totalJobs} JD nguồn.`,
      });
      return jdData;
    },
    scanCvInput: createMockScanner(),
    calculateTopMatches: createMockMatching(),
    answerCareerQuestion: createMockCareerAnswer(),
    evaluatePreflight: evaluateAgentPreflight,
  });
}
