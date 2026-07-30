"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Target, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import CVUploadForm from "../components/CVUploadForm";
import TopMatches from "../components/TopMatches";

export default function TopCompaniesPage({
  portfolio,
  matches,
  onPortfolioReady,
  onExploreMatch,
  interestStatuses,
  onToggleInterest,
  notify,
}) {
  const [isUploadOpen, setIsUploadOpen] = useState(() => !portfolio);

  const handlePortfolioReady = async (nextPortfolio) => {
    await onPortfolioReady(nextPortfolio);
    setIsUploadOpen(false);
  };

  return (
    <motion.section
      className="page-section top-companies-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="shell">
        <div className="page-hero">
          <div>
            <span className="eyebrow">MATCHING ENGINE</span>
            <h1>Top công ty phù hợp nhất</h1>
            <p>
              Mặc định hiển thị Top 3 dựa trên kỹ năng, mong muốn trong CV và
              yêu cầu tuyển dụng đang lưu trong hệ thống.
            </p>
          </div>
          <span className="page-hero__icon"><Target size={29} /></span>
        </div>

        {!portfolio ? (
          <section className="top-companies-empty">
            <span><Sparkles size={28} /></span>
            <h2>Cần CV để tạo bảng xếp hạng cá nhân</h2>
            <p>Hệ thống không suy đoán về bạn khi chưa có dữ liệu CV.</p>
            <button className="button-primary" type="button" onClick={() => setIsUploadOpen(true)}>
              <UploadCloud size={16} /> Tải CV để xem Top 3
            </button>
          </section>
        ) : (
          <>
            <div className="top-companies-context">
              <div>
                <small>HỒ SƠ ĐANG DÙNG</small>
                <strong>{portfolio.source_filename || "CV đã số hóa"}</strong>
              </div>
              <button className="button-secondary" type="button" onClick={() => setIsUploadOpen(true)}>
                <UploadCloud size={14} /> Cập nhật CV
              </button>
            </div>
            <TopMatches
              matches={(matches || []).slice(0, 3)}
              onExplore={onExploreMatch}
              interestStatuses={interestStatuses}
              onToggleInterest={onToggleInterest}
              notify={notify}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (portfolio && event.target === event.currentTarget) setIsUploadOpen(false);
            }}
          >
            <motion.article
              className="cv-upload-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              {portfolio && (
                <button
                  className="modal-close"
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  aria-label="Đóng"
                >
                  <X size={17} />
                </button>
              )}
              <header className="cv-upload-modal__header">
                <span><Target size={22} /></span>
                <div>
                  <small>CV BẮT BUỘC</small>
                  <h2>Phân tích CV để tìm Top 3</h2>
                  <p>Upload file hoặc dán nội dung. Kết quả sẽ tự xuất hiện ngay khi Scanner hoàn tất.</p>
                </div>
              </header>
              <CVUploadForm
                onPortfolioReady={handlePortfolioReady}
                notify={notify}
                submitLabel="Phân tích & hiển thị Top 3"
              />
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
