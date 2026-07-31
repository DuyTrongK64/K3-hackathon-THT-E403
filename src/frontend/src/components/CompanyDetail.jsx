"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { careerApi } from "../services/apiClient";

export default function CompanyDetail({ company, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!company?.id) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const result = await careerApi.getCompanyAnalysis(company.id);
        if (!cancelled) {
          setAnalysis(result);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [company?.id]);

  if (!company) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <motion.article
          className="company-modal company-analysis-modal"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22 }}
        >
          <button className="modal-close" type="button" onClick={onClose} aria-label="Đóng">
            <X size={17} />
          </button>
          <header className="modal-hero">
            <span className="modal-company-logo company-logo--api">
              {company.name?.slice(0, 2).toUpperCase() || "VC"}
            </span>
            <div>
              <span className="eyebrow">{company.division}</span>
              <h2>{company.name}</h2>
              <p><MapPin size={12} /> {company.locations?.join(" · ") || "Đang cập nhật"}</p>
            </div>
            <span className="modal-rating">
              <Star size={17} fill="currentColor" />
              <strong>{company.fresher_score}</strong>
              <span>Fresher friendly</span>
            </span>
          </header>

          <div className="tool-one-banner">
            <span><Sparkles size={16} /></span>
            <div>
              <small>TOOL 1 · PHÂN TÍCH CÔNG TY</small>
              <strong>Đánh giá tổng hợp từ dữ liệu doanh nghiệp và JD</strong>
            </div>
          </div>

          <div className="modal-content company-analysis-content">
            {status === "loading" ? (
              <div className="company-analysis-state">
                <span className="journey-spinner comparison-spinner" />
                <p>Tool 1 đang tổng hợp thông tin công ty...</p>
              </div>
            ) : status === "error" || !analysis ? (
              <div className="company-analysis-state">
                <ShieldCheck size={24} />
                <h3>Chưa tải được đánh giá</h3>
                <p>Vui lòng đóng cửa sổ và thử lại. Không có dữ liệu suy đoán được hiển thị.</p>
              </div>
            ) : (
              <motion.div
                className="company-analysis-grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <section className="analysis-direction">
                  <span><Compass size={15} /> ĐỊNH HƯỚNG DOANH NGHIỆP</span>
                  <p>{analysis.business_direction || "Đang cập nhật."}</p>
                  <em>{analysis.work_environment || "Môi trường đang cập nhật"}</em>
                </section>

                <section>
                  <span><Target size={15} /> LĨNH VỰC TRỌNG TÂM</span>
                  <div className="analysis-tags">
                    {(analysis.focus_areas || []).map((item) => <i key={item}>{item}</i>)}
                  </div>
                </section>

                <section>
                  <span><CheckCircle2 size={15} /> YÊU CẦU DOANH NGHIỆP</span>
                  <ul className="check-list">
                    {(analysis.company_requirements || []).length ? (
                      analysis.company_requirements.map((item) => (
                        <li key={item}><CheckCircle2 size={13} /> {item}</li>
                      ))
                    ) : (
                      <li>Yêu cầu đang được cập nhật từ JD.</li>
                    )}
                  </ul>
                </section>

                <section>
                  <span><Code2 size={15} /> TECH STACK</span>
                  <div className="analysis-tags">
                    {(analysis.tech_stack || []).map((item) => <i key={item}>{item}</i>)}
                  </div>
                </section>

                <section className="analysis-opportunities">
                  <span><BriefcaseBusiness size={15} /> NHÓM DỰ ÁN & CƠ HỘI HIỆN CÓ</span>
                  <div>
                    {(analysis.current_opportunities || []).map((item, index) => (
                      <article key={`${item.position}-${index}`}>
                        <small>{item.department}</small>
                        <strong>{item.position}</strong>
                        <p>{item.team_name} · {item.work_mode}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </div>

          <footer className="modal-footer">
            <span><ShieldCheck size={13} /> Nguồn duy nhất: Tool 1 từ dữ liệu PostgreSQL</span>
            <div><button className="button-primary" type="button" onClick={onClose}>Đã hiểu</button></div>
          </footer>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  );
}
