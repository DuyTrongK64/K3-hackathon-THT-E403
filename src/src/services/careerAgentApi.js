"use client";

const MAX_CV_SIZE = 8 * 1024 * 1024;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.onerror = () => reject(new Error("CV_FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

async function serializeCvInput(cvInput = {}) {
  const file = cvInput.file ?? null;
  if (!file) {
    return { text: cvInput.text ?? "", fileName: "", fileData: "" };
  }
  if (file.size > MAX_CV_SIZE) {
    throw new Error("CV_FILE_TOO_LARGE");
  }

  return {
    text: cvInput.text ?? "",
    fileName: file.name,
    fileType: file.type,
    fileData: await fileToBase64(file),
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

