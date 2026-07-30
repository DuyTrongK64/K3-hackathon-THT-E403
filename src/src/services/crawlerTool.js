import companiesCsv from "../data/companies.csv?raw";
import careerPagesCsv from "../data/careerPages.csv?raw";
import { createStructuredResponse } from "./groqClient";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseMockCsv(csvText) {
  if (!csvText?.trim()) return [];
  const rows = csvText
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const headers = parseCsvLine(rows[0]);

  return rows.slice(1).map((row) => {
    const values = parseCsvLine(row);
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

const toList = (value) =>
  String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const CRAWLER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["jobs", "summary"],
  properties: {
    summary: { type: "string" },
    jobs: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "seedId",
          "companyName",
          "teamName",
          "department",
          "position",
          "sourceUrl",
          "requiredSkills",
          "preferredSkills",
          "minimumExperience",
          "targetWishes",
          "workMode",
          "cleanedDescription",
        ],
        properties: {
          seedId: { type: "string" },
          companyName: { type: "string" },
          teamName: { type: "string" },
          department: { type: "string" },
          position: { type: "string" },
          sourceUrl: { type: "string" },
          requiredSkills: {
            type: "array",
            items: { type: "string" },
          },
          preferredSkills: {
            type: "array",
            items: { type: "string" },
          },
          minimumExperience: { type: "number" },
          targetWishes: {
            type: "array",
            items: { type: "string" },
          },
          workMode: { type: "string" },
          cleanedDescription: { type: "string" },
        },
      },
    },
  },
};

function buildSeedData() {
  const companies = parseMockCsv(companiesCsv);
  const pages = parseMockCsv(careerPagesCsv);
  const companyMap = new Map(
    companies.map((company) => [company.id, company]),
  );

  return {
    companies,
    jobs: pages.map((page) => {
      const company = companyMap.get(page.company_id);
      return {
        seedId: page.id,
        companyId: page.company_id,
        companyName: company?.name ?? "Công ty chưa xác định",
        division: company?.division ?? "Technology",
        location: toList(company?.location),
        fresherFriendly: Number(company?.fresher_friendly ?? 0),
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
      };
    }),
  };
}

/**
 * TOOL 1 — Crawler/cleaner powered by Groq and grounded in local CSV seeds.
 * Không bật browser tool cùng Structured Output để tránh lỗi tương thích.
 */
export async function crawlJobData({ onStatus } = {}) {
  onStatus?.({
    tool: "crawler",
    state: "running",
    message: "Crawler đang chuẩn bị danh sách công ty và nguồn tuyển dụng...",
  });
  const seed = buildSeedData();

  onStatus?.({
    tool: "crawler",
    state: "running",
    message: "Crawler đang làm sạch dữ liệu JD bằng Groq...",
  });

  const result = await createStructuredResponse({
    name: "vincareer_crawled_jobs",
    schema: CRAWLER_SCHEMA,
    instructions: `Bạn là Tool Crawler của VinCareer Insight AI.
Làm sạch và chuẩn hóa dữ liệu tuyển thực tập/fresher từ dữ liệu seed được cung cấp.
Chỉ dùng dữ liệu seed, không bổ sung hoặc suy đoán công ty, JD, kỹ năng, URL hay chính sách.
Giữ seedId để hệ thống ghép lại slots/applicants nội bộ. Viết nội dung tiếng Việt ngắn gọn.`,
    input: `Dữ liệu seed cần kiểm chứng và làm sạch:\n${JSON.stringify(
      seed.jobs,
    )}`,
    maxOutputTokens: 6000,
  });

  const seedById = new Map(seed.jobs.map((job) => [job.seedId, job]));
  const seedCompanyByName = new Map(
    seed.companies.map((company) => [
      company.name.toLowerCase(),
      company,
    ]),
  );

  const jobs = result.data.jobs.map((job, index) => {
    const fallback =
      seedById.get(job.seedId) ?? seed.jobs[index % seed.jobs.length];
    const company =
      seedCompanyByName.get(job.companyName.toLowerCase()) ??
      seed.companies.find((item) => item.id === fallback?.companyId);
    return {
      id: job.seedId || fallback?.seedId || `api-job-${index + 1}`,
      companyId: company?.id ?? fallback?.companyId ?? "unknown",
      companyName: job.companyName || company?.name || "Công ty chưa xác định",
      division: company?.division ?? "Technology",
      location: toList(company?.location),
      fresherFriendly: Number(company?.fresher_friendly ?? 0),
      teamId: fallback?.teamId ?? job.seedId,
      teamName: job.teamName || fallback?.teamName || "Project Team",
      department: job.department || fallback?.department || "Technology",
      position: job.position || fallback?.position || "Technology Intern",
      sourceUrl: job.sourceUrl || fallback?.sourceUrl || "",
      requiredSkills: job.requiredSkills ?? fallback?.requiredSkills ?? [],
      preferredSkills: job.preferredSkills ?? fallback?.preferredSkills ?? [],
      minimumExperience: Number(
        job.minimumExperience ?? fallback?.minimumExperience ?? 0,
      ),
      targetWishes: job.targetWishes ?? fallback?.targetWishes ?? [],
      workMode: job.workMode || fallback?.workMode || "Hybrid",
      maxSlots: Number(fallback?.maxSlots ?? 0),
      currentApplicants: Number(fallback?.currentApplicants ?? 0),
      cleanedDescription: job.cleanedDescription,
      crawledAt: new Date().toISOString(),
    };
  });

  const output = {
    companies: seed.companies,
    jobs,
    sourcesRead: 2,
    totalCompanies: seed.companies.length,
    totalJobs: jobs.length,
    summary: result.data.summary,
    apiUsage: result.usage,
    model: result.model,
    isMock: false,
  };

  onStatus?.({
    tool: "crawler",
    state: "done",
    message: `Đã cập nhật ${jobs.length} JD từ ${seed.companies.length} công ty bằng API thật.`,
  });
  return output;
}
