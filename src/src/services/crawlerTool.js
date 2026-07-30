import companiesCsv from "../data/companies.csv?raw";
import careerPagesCsv from "../data/careerPages.csv?raw";

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

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

/**
 * TOOL 1 — Mock crawler.
 * Đọc hai CSV local, ghép dữ liệu công ty với trang tuyển dụng và làm sạch JD.
 */
export async function crawlJobData({ onStatus } = {}) {
  onStatus?.({
    tool: "crawler",
    state: "running",
    message: "Crawler đang đọc danh sách 6 công ty...",
  });
  await wait(420);

  const companies = parseMockCsv(companiesCsv);
  const careerPages = parseMockCsv(careerPagesCsv);
  const companyMap = new Map(
    companies.map((company) => [company.id, company]),
  );

  onStatus?.({
    tool: "crawler",
    state: "running",
    message: "Đang cập nhật dữ liệu JD từ hệ thống...",
  });
  await wait(520);

  const jobs = careerPages.map((page) => {
    const company = companyMap.get(page.company_id);
    return {
      id: page.id,
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
      cleanedDescription: `${page.position} tại ${page.team_name}. Yêu cầu chính: ${toList(
        page.required_skills,
      ).join(", ")}. Điểm cộng: ${toList(page.preferred_skills).join(", ")}.`,
      crawledAt: new Date().toISOString(),
    };
  });

  const output = {
    companies,
    jobs,
    sourcesRead: 2,
    totalCompanies: companies.length,
    totalJobs: jobs.length,
    isMock: true,
  };

  onStatus?.({
    tool: "crawler",
    state: "done",
    message: `Đã làm sạch ${jobs.length} JD từ ${companies.length} công ty.`,
  });
  return output;
}
