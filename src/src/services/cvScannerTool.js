const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const SKILL_DICTIONARY = [
  "React",
  "TypeScript",
  "JavaScript",
  "Python",
  "SQL",
  "Git",
  "PyTorch",
  "C++",
  "Java",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Linux",
  "Networking",
  "LLM",
  "Spark",
];

const WISH_DICTIONARY = [
  "frontend",
  "backend",
  "ai",
  "research",
  "data",
  "product",
  "fintech",
  "automotive",
  "healthtech",
  "security",
  "hybrid",
  "onsite",
  "social impact",
];

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function extractExperience(text) {
  const yearMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:năm|year|years)/i);
  if (yearMatch) return Number(yearMatch[1].replace(",", "."));
  const monthMatch = text.match(/(\d+)\s*(?:tháng|month|months)/i);
  if (monthMatch) return Math.round((Number(monthMatch[1]) / 12) * 10) / 10;
  return 0;
}

/**
 * TOOL 2 — Mock CV scanner.
 * Chuẩn hóa file/text thành JSON có thể ghi thành một dòng CSV.
 */
export async function scanCvInput(
  { file = null, text = "" } = {},
  { onStatus } = {},
) {
  if (!file && !String(text).trim()) {
    throw new Error("CV_INPUT_REQUIRED");
  }

  onStatus?.({
    tool: "cvScanner",
    state: "running",
    message: "CV Scanner đang chuyển đổi hồ sơ sang dữ liệu có cấu trúc...",
  });
  await wait(560);

  const fallbackText = file
    ? "Frontend intern React TypeScript JavaScript Git Python SQL hybrid product"
    : "";
  const sourceText = `${text} ${file?.name ?? ""} ${fallbackText}`.trim();
  const normalizedText = normalize(sourceText);

  const skills = SKILL_DICTIONARY.filter((skill) =>
    normalizedText.includes(normalize(skill)),
  );
  const wishes = WISH_DICTIONARY.filter((wish) =>
    normalizedText.includes(normalize(wish)),
  );
  const experienceYears = extractExperience(sourceText);
  const safeSkills = skills.length
    ? skills
    : ["React", "TypeScript", "JavaScript", "Git"];
  const safeWishes = wishes.length
    ? wishes
    : ["frontend", "product", "hybrid"];

  await wait(360);

  const profile = {
    candidateId: "mock-candidate-001",
    source: file ? "uploaded_file" : "pasted_text",
    fileName: file?.name ?? null,
    skills: safeSkills,
    experienceYears,
    wishes: {
      targetDomains: safeWishes.filter(
        (wish) => !["hybrid", "onsite"].includes(wish),
      ),
      workModes: safeWishes.filter((wish) =>
        ["hybrid", "onsite"].includes(wish),
      ),
      priorities: [
        "Được mentor trực tiếp",
        "Tham gia dự án thực tế",
        "Có cơ hội nhận offer sau 6 tuần",
      ],
    },
    summary:
      "Ứng viên fresher có nền tảng web, khả năng làm việc theo sản phẩm và mong muốn môi trường có mentoring.",
    csvRow: [
      "mock-candidate-001",
      safeSkills.join("|"),
      experienceYears,
      safeWishes.join("|"),
    ].join(","),
    scannedAt: new Date().toISOString(),
    isMock: true,
  };

  onStatus?.({
    tool: "cvScanner",
    state: "done",
    message: `Đã nhận diện ${safeSkills.length} kỹ năng và ${safeWishes.length} mong muốn.`,
  });
  return profile;
}
