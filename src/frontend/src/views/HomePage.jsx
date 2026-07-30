"use client";

import { motion } from "motion/react";
import {
  ArrowLeftRight,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";

const JOURNEY = [
  { icon: FileSearch, label: "Scanner CV", note: "Số hóa kỹ năng & mong muốn" },
  { icon: Target, label: "Matching", note: "Chấm theo tiêu chí tuyển dụng" },
  { icon: Bot, label: "AI Agent", note: "Giải thích kết quả có grounding" },
];

export default function HomePage({ onNavigate }) {
  return (
    <section className="hero hero--single-view">
      <div className="shell hero__inner">
        <motion.div
          className="hero__copy"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="live-pill"><i className="live-dot" /> AI Career Intelligence</span>
          <h1>
            Chọn đúng nơi.<br />
            <span>Đi đúng hướng.</span>
          </h1>
          <p className="hero__tagline">
            Gia nhập hệ sinh thái Vingroup: khám phá công ty, số hóa CV và
            đối chiếu kỹ năng với yêu cầu tuyển dụng bằng AI có kiểm soát.
          </p>
          <div className="home-primary-actions">
            <button className="button-primary home-cta" type="button" onClick={() => onNavigate("portfolio")}>
              <FileText size={17} /> Tạo Portfolio từ CV <ArrowRight size={16} />
            </button>
            <button className="button-secondary home-cta" type="button" onClick={() => onNavigate("comparison")}>
              <ArrowLeftRight size={17} /> So sánh công ty
            </button>
          </div>
          <div className="hero__proof">
            <div><CheckCircle2 size={13} /><strong>3 Tools</strong><span>Backend thật</span></div>
            <i />
            <div><CheckCircle2 size={13} /><strong>PostgreSQL</strong><span>Dữ liệu tập trung</span></div>
            <i />
            <div><CheckCircle2 size={13} /><strong>Không dùng lương</strong><span>Matching minh bạch</span></div>
          </div>
        </motion.div>

        <motion.aside
          className="hero-dashboard home-agent-card"
          initial={{ opacity: 0, scale: 0.96, x: 18 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <div className="dashboard-top">
            <div>
              <span className="micro-label">CAREER PIPELINE</span>
              <h3>Hồ sơ đến cơ hội phù hợp</h3>
            </div>
            <span className="dashboard-status"><i /> Sẵn sàng</span>
          </div>
          <div className="home-journey-list">
            {JOURNEY.map((step, index) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
              >
                <span><step.icon size={18} /></span>
                <div><strong>{step.label}</strong><small>{step.note}</small></div>
                <em>0{index + 1}</em>
              </motion.div>
            ))}
          </div>
          <div className="insight-banner home-insight">
            <div><Sparkles size={18} /></div>
            <span>
              <strong>Agent hiện diện trên mọi trang</strong>
              Dùng nút chat nổi để hỏi bất cứ lúc nào, không cần rời luồng đang làm.
            </span>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
