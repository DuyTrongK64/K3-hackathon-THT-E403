"use client";

const MAX_CV_SIZE = 8 * 1024 * 1024;

async function extractPdfText(file) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(bytes);
  const result = await extractText(pdf, { mergePages: true });
  return String(result.text ?? "").trim();
}

async function extractDocxText(file) {
  const mammothModule = await import("mammoth");
  const mammoth = mammothModule.default ?? mammothModule;
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return String(result.value ?? "").trim();
}

async function extractCvText(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  try {
    if (extension === "pdf") return await extractPdfText(file);
    if (extension === "docx") return await extractDocxText(file);
    throw new Error("CV_FILE_UNSUPPORTED");
  } catch (error) {
    if (error?.message === "CV_FILE_UNSUPPORTED") throw error;
    throw new Error("CV_FILE_READ_FAILED");
  }
}

async function serializeCvInput(cvInput = {}) {
  const file = cvInput.file ?? null;
  if (!file) {
    return { text: cvInput.text ?? "", fileName: "", fileData: "" };
  }
  if (file.size > MAX_CV_SIZE) {
    throw new Error("CV_FILE_TOO_LARGE");
  }
  const extractedText = await extractCvText(file);
  if (!extractedText) throw new Error("CV_UNREADABLE_CONTENT");

  return {
    text: [cvInput.text, extractedText].filter(Boolean).join("\n\n"),
    fileName: file.name,
    fileType: file.type,
    fileData: "",
  };
}

export async function requestCareerAgent(
  {
    message,
    cvInput = {},
    existingJdData = null,
    existingCvData = null,
  },
  { onStatus } = {},
) {
  const serializedCv = await serializeCvInput(cvInput);
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      cvInput: serializedCv,
      existingJdData,
      existingCvData,
    }),
  });

  if (!response.body) {
    throw new Error("AGENT_STREAM_UNAVAILABLE");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === "status") onStatus?.(event.step);
      if (event.type === "result") result = event.result;
      if (event.type === "error") {
        const error = new Error(event.code || "AGENT_API_ERROR");
        error.detail = event.message;
        throw error;
      }
    }

    if (done) break;
  }

  if (!response.ok || !result) {
    throw new Error("AGENT_API_ERROR");
  }
  return result;
}
