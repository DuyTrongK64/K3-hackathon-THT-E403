import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, stringifyCsv } from "./lib/csv.mjs";
import { createMockGeminiAgent } from "./lib/mockGeminiAgent.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(currentDir, "..");
const EVAL_FILES = ["quest.csv", "life_quest.csv", "result.csv"];
const PASS_THRESHOLD = 0.8;

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

async function readCsv(relativePath) {
  const absolutePath = path.resolve(projectDir, relativePath);
  const text = await readFile(absolutePath, "utf8");
  return parseCsv(text);
}

function toTestCase(row, sourceFile, index) {
  return {
    sourceFile,
    caseNumber: row.Câu || row.Case || String(index + 1),
    input:
      row.Input_Question ??
      row["Đưa vào"] ??
      row.Question ??
      "",
    expected:
      row.Expected_Output ??
      row["Phải trả lời"] ??
      row.Expected ??
      "",
  };
}

async function loadEvalCases() {
  const cases = [];
  for (const fileName of EVAL_FILES) {
    try {
      const parsed = await readCsv(`eval/${fileName}`);
      if (!parsed.headers.length) {
        console.log(`[${fileName}] SKIP - file trống.`);
        continue;
      }
      if (parsed.headers.includes("Status")) {
        console.log(`[${fileName}] SKIP - đây là file report của lần chạy trước.`);
        continue;
      }
      const fileCases = parsed.rows
        .map((row, index) => toTestCase(row, fileName, index))
        .filter((testCase) => testCase.input && testCase.expected);
      console.log(`[${fileName}] Đã đọc ${fileCases.length} test case.`);
      cases.push(...fileCases);
    } catch (error) {
      throw new Error(`Không thể đọc ${fileName}: ${error.message}`);
    }
  }
  return cases;
}

function prepareCvInput(question) {
  const value = normalize(question);
  if (value.includes("cv hoan toan trong")) {
    return { text: "", fileName: "empty.pdf" };
  }
  if (value.includes("2 file cv")) {
    return {
      text: "React TypeScript JavaScript",
      files: [{ name: "cv-1.pdf" }, { name: "cv-2.pdf" }],
    };
  }
  if (
    value.includes(".jpg") ||
    value.includes("anh chup") ||
    value.includes("loi font")
  ) {
    return { text: question, fileName: "cv.jpg" };
  }
  if (value.includes("ke toan") || value.includes("tai chinh")) {
    return {
      text: `${question} Kế toán Tài chính Accounting Finance, 6 tháng kinh nghiệm.`,
      fileName: "accounting-cv.pdf",
    };
  }
  if (value.includes("html/css")) {
    return {
      text: `${question} HTML CSS, 2 tháng kinh nghiệm.`,
      fileName: "junior-cv.pdf",
    };
  }
  if (value.includes("python") && value.includes("pytorch")) {
    return {
      text: `${question} Python PyTorch Git, 6 tháng kinh nghiệm AI.`,
      fileName: "ai-cv.pdf",
    };
  }
  if (value.includes("remote") || value.includes("tu xa")) {
    return {
      text: `${question} React TypeScript Git. Mong muốn Remote, Hybrid.`,
      fileName: "remote-cv.pdf",
    };
  }
  if (value.includes("toan tieng anh")) {
    return {
      text: "Frontend intern with React TypeScript JavaScript Git and 6 months of experience. Looking for hybrid product work.",
      fileName: "english-cv.pdf",
    };
  }
  if (
    value.includes("tai cv") ||
    value.includes("tai len cv") ||
    value.includes("profile") ||
    value.includes("cv cua toi") ||
    value.includes("tho go")
  ) {
    return {
      text: `${question} React TypeScript JavaScript Git, 4 tháng kinh nghiệm frontend, mong muốn Hybrid.`,
      fileName: "candidate-cv.pdf",
    };
  }
  return {};
}

function errorAnswer(error) {
  const messages = {
    CV_EMPTY_CONTENT: "Không tìm thấy nội dung trong CV. File CV trống.",
    CV_UNREADABLE_CONTENT:
      "Hệ thống không thể đọc nội dung file này, vui lòng sử dụng định dạng PDF chuẩn.",
    CV_NO_SKILLS_FOUND: "CV không có kỹ năng đủ rõ để đánh giá.",
  };
  return messages[error.message] ?? `Tool thất bại: ${error.message}`;
}

function validateExpected(expected, actual, trace) {
  const value = normalize(expected);
  const answer = normalize(actual.answer);
  const tools = trace.map((step) => step.tool);
  const reasons = [];

  if (value.includes("tool 1") && !tools.includes("crawler")) {
    reasons.push("Thiếu Tool 1/Crawler trong trace.");
  }
  const requiresScanner =
    value.includes("goi tool 2") ||
    value.includes("tool 2 quet") ||
    value.includes("tool 2 dich");
  if (requiresScanner && !tools.includes("cvScanner")) {
    reasons.push("Thiếu Tool 2/CV Scanner trong trace.");
  }
  const requiresMatching =
    value.includes("goi tool 3") ||
    value.includes("tool 3 so sanh") ||
    value.includes("tool 3 phai") ||
    value.includes("tool 3 tra");
  if (
    requiresMatching &&
    !value.includes("khong duoc goi tool 3") &&
    !tools.includes("matching")
  ) {
    reasons.push("Thiếu Tool 3/Matching trong trace.");
  }
  if (
    value.includes("khong duoc goi tool 3") &&
    tools.includes("matching")
  ) {
    reasons.push("Matching vẫn chạy dù CV không hợp lệ.");
  }
  if (
    value.includes("top 3") &&
    !value.includes("khong co cong ty") &&
    (actual.matches?.length ?? 0) < 3
  ) {
    reasons.push("Không trả đủ Top 3.");
  }
  if (
    value.includes("khong co cong ty") &&
    !answer.includes("khong co")
  ) {
    reasons.push("Thiếu thông báo không có kết quả phù hợp.");
  }
  if (
    value.includes("remote") &&
    value.includes("hybrid") &&
    !["remote", "hybrid"].includes(
      normalize(actual.matches?.[0]?.sourceJob?.workMode),
    )
  ) {
    reasons.push("Top 1 không ưu tiên Remote/Hybrid.");
  }
  if (
    value.includes("ngoai pham vi") &&
    !answer.includes("chi ho tro")
  ) {
    reasons.push("Không từ chối câu hỏi ngoài phạm vi.");
  }
  if (
    value.includes("< 20") &&
    !(
      Number(actual.matches?.[0]?.score) < 20 ||
      /\b(?:0|[1-9]|1\d)%/.test(actual.answer)
    )
  ) {
    reasons.push("Điểm không thấp hơn 20%.");
  }
  if (
    value.includes("khong the doc") &&
    !answer.includes("khong the doc")
  ) {
    reasons.push("Thiếu lỗi không đọc được CV.");
  }
  if (
    value.includes("hoi lai") &&
    !(answer.includes("vi tri nao") && answer.includes("cong ty nao"))
  ) {
    reasons.push("Agent không hỏi lại để lấy context.");
  }
  if (
    value.includes("khong duoc phep tiet lo") &&
    !answer.includes("khong the tiet lo")
  ) {
    reasons.push("Agent không bảo vệ System Prompt.");
  }
  if (
    value.includes("chi tai len 1 cv") &&
    !answer.includes("chi tai len 1 cv")
  ) {
    reasons.push("Thiếu validation số lượng CV.");
  }
  if (
    value.includes("fpt software khong nam") &&
    !answer.includes("chi ho tro")
  ) {
    reasons.push("Không giới hạn phạm vi công ty.");
  }
  if (
    value.includes("cap quyen xem") &&
    !answer.includes("cap quyen xem")
  ) {
    reasons.push("Thiếu hướng dẫn quyền truy cập Drive.");
  }
  if (
    value.includes("mapping") &&
    !(answer.includes("vinfast") && answer.includes("vinai"))
  ) {
    reasons.push("Không chuẩn hóa đúng tên công ty tiếng lóng.");
  }
  return reasons;
}

const COMPANY_UNIVERSE = [
  "VinFast",
  "VinAI",
  "VinBigData",
  "One Mount",
  "VinBrain",
  "VinCSS",
  "FPT Software",
  "Viettel",
  "Grab",
];

const TECH_UNIVERSE = [
  "ReactJS",
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Node",
  "TypeScript",
  "JavaScript",
  "Python",
  "PyTorch",
  "Java",
  "Go",
  "C++",
  "AWS",
  "GCP",
  "Azure",
  "Kafka",
  "Kubernetes",
  "Docker",
  "Spark",
  "CUDA",
  "Kotlin",
];

function detectHallucination({ question, actualText, sourceText, companies }) {
  const issues = [];
  const normalizedQuestion = normalize(question);
  const normalizedActual = normalize(actualText);
  const normalizedSource = normalize(sourceText);
  const allowedCompanies = companies.map((company) =>
    normalize(company.name),
  );

  for (const company of COMPANY_UNIVERSE) {
    const normalizedCompany = normalize(company);
    if (
      normalizedActual.includes(normalizedCompany) &&
      !allowedCompanies.some(
        (allowed) =>
          allowed.includes(normalizedCompany) ||
          normalizedCompany.includes(allowed),
      ) &&
      !normalizedQuestion.includes(normalizedCompany)
    ) {
      issues.push(`Công ty ngoài nguồn: ${company}.`);
    }
  }

  for (const technology of TECH_UNIVERSE) {
    const normalizedTechnology = normalize(technology);
    const appearsInActual = normalizedActual.includes(normalizedTechnology);
    const appearsInEvidence =
      normalizedQuestion.includes(normalizedTechnology) ||
      normalizedSource.includes(normalizedTechnology) ||
      (normalizedTechnology === "reactjs" &&
        normalizedSource.includes("react"));
    if (appearsInActual && !appearsInEvidence) {
      issues.push(`Tech Stack ngoài nguồn/input: ${technology}.`);
    }
  }

  const salaryPattern = /(\d+(?:[.,]\d+)?)\s*(?:trieu|triệu|million)\b/gi;
  for (const match of actualText.matchAll(salaryPattern)) {
    const amount = normalize(match[1]);
    if (
      !normalizedQuestion.includes(amount) &&
      !normalizedSource.includes(amount)
    ) {
      issues.push(`Mức lương ${match[0]} không có trong nguồn/input.`);
    }
  }

  if (
    normalizedQuestion.includes("ceo") &&
    !normalizedSource.includes("ceo") &&
    !normalizedActual.includes("khong chua thong tin")
  ) {
    issues.push("Bịa thông tin lãnh đạo không có trong CSV.");
  }
  if (
    /(ot|sa thai|duoi viec)/.test(normalizedQuestion) &&
    !/(ot|sa thai|duoi viec)/.test(normalizedSource) &&
    !normalizedActual.includes("khong chua thong tin")
  ) {
    issues.push("Suy diễn tin đồn OT/sa thải ngoài dữ liệu.");
  }
  return issues;
}

function diagnose(reasons) {
  if (reasons.some((reason) => reason.includes("Crawler"))) {
    return "src/services/agentRouter.js: intent prompt hoặc routing Tool 1.";
  }
  if (reasons.some((reason) => reason.includes("CV"))) {
    return "src/services/cvScannerTool.js: schema/prompt validation CV.";
  }
  if (
    reasons.some((reason) =>
      /(Matching|Top 3|Điểm|Remote)/.test(reason),
    )
  ) {
    return "src/services/matchingTool.js: prompt và thuật toán scoring.";
  }
  if (reasons.some((reason) => /Bịa|ngoài nguồn|Suy diễn/.test(reason))) {
    return "src/services/agentSafetyPolicy.js và grounding prompt trong agentRouter.js.";
  }
  return "src/services/agentRouterCore.js: policy/routing tổng quát.";
}

async function main() {
  const testCases = await loadEvalCases();
  if (!testCases.length) throw new Error("Không có test case hợp lệ.");

  const companiesCsv = await readCsv("src/data/companies.csv");
  const jobsCsv = await readCsv("src/data/careerPages.csv");
  const sourceText = [
    JSON.stringify(companiesCsv.rows),
    JSON.stringify(jobsCsv.rows),
  ].join("\n");
  const agent = createMockGeminiAgent({
    companies: companiesCsv.rows,
    careerPages: jobsCsv.rows,
  });

  const results = [];
  for (const testCase of testCases) {
    const trace = [];
    let actual;
    try {
      actual = await agent.process(
        {
          message: testCase.input,
          cvInput: prepareCvInput(testCase.input),
        },
        { onStatus: (step) => trace.push(step) },
      );
    } catch (error) {
      actual = { answer: errorAnswer(error), matches: [], intent: "error" };
    }

    const actualText = JSON.stringify({
      answer: actual.answer,
      matches: actual.matches,
    });
    const validationReasons = validateExpected(
      testCase.expected,
      actual,
      trace,
    );
    const hallucinations = detectHallucination({
      question: testCase.input,
      actualText,
      sourceText,
      companies: companiesCsv.rows,
    });
    const reasons = [...hallucinations, ...validationReasons];
    const status = reasons.length ? "FAIL" : "PASS";
    console.log(
      `[${testCase.sourceFile}] - [Câu ${testCase.caseNumber}] - [${status}] - [${
        reasons.join(" | ") || "Đạt expected output và grounding."
      }]`,
    );
    results.push({
      Source_File: testCase.sourceFile,
      Case: testCase.caseNumber,
      Input_Question: testCase.input,
      Expected_Output: testCase.expected,
      Actual_Output: actual.answer,
      Status: status,
      Failure_Reason: reasons.join(" | "),
      Hallucination: hallucinations.length ? "YES" : "NO",
      Suggested_Fix: reasons.length ? diagnose(reasons) : "",
    });
  }

  const passed = results.filter((result) => result.Status === "PASS").length;
  const hallucinated = results.filter(
    (result) => result.Hallucination === "YES",
  ).length;
  const passRate = passed / results.length;
  console.log("\n===== VINCAREER AGENT EVAL REPORT =====");
  console.log(`Total: ${results.length}`);
  console.log(`Pass: ${passed}`);
  console.log(`Fail: ${results.length - passed}`);
  console.log(`Hallucination violations: ${hallucinated}`);
  console.log(`Pass rate: ${(passRate * 100).toFixed(2)}%`);

  const headers = [
    "Source_File",
    "Case",
    "Input_Question",
    "Expected_Output",
    "Actual_Output",
    "Status",
    "Failure_Reason",
    "Hallucination",
    "Suggested_Fix",
  ];
  await writeFile(
    path.resolve(projectDir, "eval/result.csv"),
    `${stringifyCsv(headers, results)}\n`,
    "utf8",
  );
  console.log("Report: eval/result.csv");

  if (passRate < PASS_THRESHOLD || hallucinated > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[FATAL] ${error.stack || error.message}`);
  process.exitCode = 1;
});
