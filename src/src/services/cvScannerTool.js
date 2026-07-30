import { createStructuredResponse } from "./openaiClient";

const CV_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "skills",
    "experienceYears",
    "targetDomains",
    "workModes",
    "priorities",
    "summary",
  ],
  properties: {
    skills: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    experienceYears: { type: "number" },
    targetDomains: {
      type: "array",
      items: { type: "string" },
    },
    workModes: {
      type: "array",
      items: { type: "string" },
    },
    priorities: {
      type: "array",
      items: { type: "string" },
    },
    summary: { type: "string" },
  },
};

/**
 * TOOL 2 — CV scanner powered by OpenAI file/text understanding.
 */
export async function scanCvInput(
  { file = null, text = "", fileData = "", fileName = "" } = {},
  { onStatus } = {},
) {
  const resolvedFileName = fileName || file?.name || "";
  const resolvedFileData = fileData || file?.fileData || "";

  if (!resolvedFileData && !String(text).trim()) {
    throw new Error("CV_INPUT_REQUIRED");
  }

  onStatus?.({
    tool: "cvScanner",
    state: "running",
    message: "CV Scanner đang đọc nội dung hồ sơ bằng OpenAI...",
  });

  const content = [
    {
      type: "input_text",
      text: `Phân tích CV ứng viên thực tập. Nội dung người dùng dán:\n${
        String(text).trim() || "(không có)"
      }`,
    },
  ];

  if (resolvedFileData) {
    content.push({
      type: "input_file",
      filename: resolvedFileName || "candidate-cv.pdf",
      file_data: resolvedFileData,
      detail: "low",
    });
  }

  const result = await createStructuredResponse({
    name: "vincareer_cv_profile",
    schema: CV_SCHEMA,
    instructions: `Bạn là CV Scanner cho sinh viên công nghệ.
Trích xuất đúng dữ kiện có trong CV, không tự thêm kỹ năng hoặc kinh nghiệm.
Chuẩn hóa tên kỹ năng (React, TypeScript, Python, PyTorch, SQL...).
experienceYears là tổng kinh nghiệm liên quan, có thể là số thập phân.
Suy ra mong muốn nghề nghiệp thận trọng từ mục tiêu, dự án và nội dung CV.
Trả nội dung tiếng Việt, ngắn gọn và phù hợp ứng viên intern/fresher.`,
    input: [{ role: "user", content }],
    maxOutputTokens: 2200,
  });

  const candidateId = `candidate-${Date.now()}`;
  const profile = {
    candidateId,
    source: resolvedFileData ? "uploaded_file" : "pasted_text",
    fileName: resolvedFileName || null,
    skills: result.data.skills,
    experienceYears: Math.max(0, Number(result.data.experienceYears ?? 0)),
    wishes: {
      targetDomains: result.data.targetDomains,
      workModes: result.data.workModes,
      priorities: result.data.priorities,
    },
    summary: result.data.summary,
    csvRow: [
      candidateId,
      result.data.skills.join("|"),
      result.data.experienceYears,
      [...result.data.targetDomains, ...result.data.workModes].join("|"),
    ].join(","),
    scannedAt: new Date().toISOString(),
    apiUsage: result.usage,
    model: result.model,
    isMock: false,
  };

  onStatus?.({
    tool: "cvScanner",
    state: "done",
    message: `Đã nhận diện ${profile.skills.length} kỹ năng và ${profile.wishes.targetDomains.length} định hướng.`,
  });
  return profile;
}
