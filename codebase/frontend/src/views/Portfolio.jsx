"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";
import CVUploadForm from "../components/CVUploadForm";

export default function Portfolio({
  portfolio,
  onPortfolioReady,
  notify,
}) {
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
          <CVUploadForm onPortfolioReady={onPortfolioReady} notify={notify} />

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
