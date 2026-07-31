"use client";

import {
  CheckCircle2,
  FileText,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { careerApi } from "../services/apiClient";

export default function CVUploadForm({
  onPortfolioReady,
  notify,
  submitLabel = "Phân tích & lưu Portfolio",
}) {
  const [mode, setMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [cvText, setCvText] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const canSubmit = mode === "upload" ? Boolean(file) : cvText.trim().length >= 20;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || isScanning) return;
    setIsScanning(true);
    try {
      const result =
        mode === "upload"
          ? await careerApi.scanCVFile(file)
          : await careerApi.scanCVText(cvText.trim());
      await onPortfolioReady(result);
      setFile(null);
      setCvText("");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không thể phân tích CV.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <form className="cv-analyzer-input" onSubmit={handleSubmit}>
      <div className="journey-panel-title">
        <div>
          <span><UploadCloud size={19} /></span>
          <div><small>TOOL SCANNER</small><h3>Cập nhật CV</h3></div>
        </div>
        <em className="backend-badge">BACKEND API</em>
      </div>

      <div className="cv-mode-switch">
        <button
          type="button"
          className={mode === "upload" ? "is-active" : ""}
          onClick={() => setMode("upload")}
        >
          <UploadCloud size={13} /> Tải file
        </button>
        <button
          type="button"
          className={mode === "text" ? "is-active" : ""}
          onClick={() => setMode("text")}
        >
          <FileText size={13} /> Dán nội dung
        </button>
      </div>

      {mode === "upload" ? (
        <label className={`journey-upload-zone ${file ? "has-file" : ""}`}>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {file ? <CheckCircle2 size={30} /> : <UploadCloud size={30} />}
          <strong>{file?.name || "Chọn CV từ thiết bị"}</strong>
          <span>PDF hoặc DOCX · Tối đa 8 MB</span>
        </label>
      ) : (
        <div className="journey-cv-text">
          <textarea
            value={cvText}
            onChange={(event) => setCvText(event.target.value)}
            placeholder="Dán nội dung CV, gồm kỹ năng, dự án, kinh nghiệm và mục tiêu..."
          />
          <span>{cvText.length}/60.000</span>
        </div>
      )}

      <button className="analyze-cv-button" type="submit" disabled={!canSubmit || isScanning}>
        {isScanning ? (
          <><span className="journey-spinner" /> Agent đang phân tích...</>
        ) : (
          <><Sparkles size={15} /> {submitLabel}</>
        )}
      </button>
      <div className="cv-analyzer-notes">
        <span><CheckCircle2 size={10} /> Không tự thêm kỹ năng</span>
        <span><CheckCircle2 size={10} /> Không dùng kỳ vọng lương</span>
      </div>
    </form>
  );
}
