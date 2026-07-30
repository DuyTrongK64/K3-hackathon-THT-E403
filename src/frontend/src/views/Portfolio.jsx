"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Layers3,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { careerApi } from "../services/apiClient";

export default function Portfolio({ portfolio, onPortfolioReady, notify }) {
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
      onPortfolioReady(result);
      notify("Đã số hóa CV và lưu Portfolio vào PostgreSQL.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không thể phân tích CV.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.section
      className="page-section portfolio-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="shell">
        <div className="page-hero">
          <div>
            <span className="eyebrow">MY PORTFOLIO</span>
            <h1>Hồ sơ năng lực đã số hóa</h1>
            <p>
              Scanner chạy ở Backend, trích xuất đúng dữ kiện trong CV và lưu hồ sơ
              để Agent dùng cho các lần hỏi tiếp theo.
            </p>
          </div>
          <span className="page-hero__icon"><FileText size={29} /></span>
        </div>

        <div className="portfolio-layout">
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
                <><Sparkles size={15} /> Phân tích & lưu Portfolio</>
              )}
            </button>
            <div className="cv-analyzer-notes">
              <span><CheckCircle2 size={10} /> Không tự thêm kỹ năng</span>
              <span><CheckCircle2 size={10} /> Không dùng kỳ vọng lương</span>
            </div>
          </form>

          <section className="portfolio-result-card">
            <AnimatePresence mode="wait">
              {!portfolio ? (
                <motion.div
                  className="analysis-empty"
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div><i /><FileText size={34} /></div>
                  <h3>Portfolio sẽ xuất hiện tại đây</h3>
                  <p>Tải file hoặc dán CV để bắt đầu luồng Scanner → PostgreSQL.</p>
                </motion.div>
              ) : (
                <motion.div
                  className="portfolio-profile"
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <header>
                    <span><Sparkles size={20} /></span>
                    <div>
                      <small>PORTFOLIO ĐÃ SỐ HÓA</small>
                      <h2>{portfolio.source_filename}</h2>
                    </div>
                    <em>{portfolio.experience_years || 0} năm KN</em>
                  </header>
                  <p className="portfolio-summary">{portfolio.summary || "Chưa có tóm tắt."}</p>

                  <div className="portfolio-section">
                    <span><Layers3 size={14} /> KỸ NĂNG</span>
                    <div className="portfolio-tags">
                      {(portfolio.skills || []).length ? (
                        portfolio.skills.map((skill) => <i key={skill}>{skill}</i>)
                      ) : (
                        <small>Chưa trích xuất được kỹ năng.</small>
                      )}
                    </div>
                  </div>

                  <div className="portfolio-grid">
                    <div>
                      <span><Target size={15} /></span>
                      <small>ĐỊNH HƯỚNG</small>
                      <strong>{portfolio.target_domains?.join(" · ") || "Chưa xác định"}</strong>
                    </div>
                    <div>
                      <span><BriefcaseBusiness size={15} /></span>
                      <small>MÔI TRƯỜNG</small>
                      <strong>{portfolio.work_modes?.join(" · ") || "Linh hoạt"}</strong>
                    </div>
                  </div>

                  <div className="portfolio-section">
                    <span><CheckCircle2 size={14} /> ƯU TIÊN CÁ NHÂN</span>
                    <ul>
                      {(portfolio.priorities || []).length ? (
                        portfolio.priorities.map((priority) => <li key={priority}>{priority}</li>)
                      ) : (
                        <li>Chưa có dữ liệu — Agent sẽ hỏi thêm khi cần.</li>
                      )}
                    </ul>
                  </div>
                  <div className="portfolio-saved-note">
                    <CheckCircle2 size={14} />
                    Đã lưu hồ sơ ID {String(portfolio.id).slice(0, 8)}… vào PostgreSQL.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </motion.section>
  );
}
