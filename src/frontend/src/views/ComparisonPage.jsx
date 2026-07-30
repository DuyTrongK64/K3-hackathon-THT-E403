"use client";

import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeftRight,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Code2,
  Gauge,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { careerApi } from "../services/apiClient";

const DEFAULT_CRITERIA = [
  {
    id: "fallback-wishes",
    key: "candidate_wishes",
    label: "Mong muốn ứng viên",
    description: "Domain và môi trường làm việc mong muốn.",
    weight: 0.4,
  },
  {
    id: "fallback-required",
    key: "required_skills",
    label: "Kỹ năng bắt buộc",
    description: "Kỹ năng chính trong JD.",
    weight: 0.5,
  },
  {
    id: "fallback-preferred",
    key: "preferred_skills",
    label: "Kỹ năng ưu tiên",
    description: "Kỹ năng tạo lợi thế.",
    weight: 0.1,
  },
];

const ICONS = {
  candidate_wishes: Target,
  required_skills: Code2,
  preferred_skills: Sparkles,
  tech_stack: Code2,
  work_environment: BriefcaseBusiness,
  locations: MapPin,
};

function uniqueJobValues(company, key) {
  return [
    ...new Set((company?.jd_data || []).flatMap((job) => job?.[key] || [])),
  ];
}

function criterionValue(company, key) {
  if (!company) return "Chưa có dữ liệu";
  const mappings = {
    candidate_wishes: uniqueJobValues(company, "target_wishes"),
    required_skills: uniqueJobValues(company, "required_skills"),
    preferred_skills: uniqueJobValues(company, "preferred_skills"),
    tech_stack: company.tech_stack || [],
    work_environment: company.work_environment,
    locations: company.locations || [],
    fresher_score: `${company.fresher_score || 0}/5`,
  };
  const value = mappings[key];
  if (Array.isArray(value)) return value.length ? value.join(" · ") : "Chưa cập nhật";
  if (value !== undefined && value !== null && value !== "") return String(value);
  return "Tiêu chí mới — chưa có mapping dữ liệu";
}

function CompanyHeader({ company }) {
  if (!company) return <p>Chưa chọn công ty</p>;
  return (
    <>
      <span className="company-logo company-logo--api">{company.name.slice(0, 2).toUpperCase()}</span>
      <span>
        <h3>{company.name}</h3>
        <p>{company.division} · {company.locations?.join(", ") || "Đang cập nhật"}</p>
      </span>
    </>
  );
}

export default function ComparisonPage({ notify }) {
  const [companies, setCompanies] = useState([]);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usesFallback, setUsesFallback] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [companyData, criterionData] = await Promise.all([
        careerApi.listCompanies(),
        careerApi.listCriteria(),
      ]);
      const safeCompanies = Array.isArray(companyData) ? companyData : [];
      const safeCriteria = Array.isArray(criterionData) ? criterionData : [];
      setCompanies(safeCompanies);
      setCriteria(safeCriteria.length ? safeCriteria : DEFAULT_CRITERIA);
      setUsesFallback(!safeCriteria.length);
      setLeftId((current) => current || safeCompanies[0]?.id || "");
      setRightId((current) => current || safeCompanies[1]?.id || safeCompanies[0]?.id || "");
    } catch (loadError) {
      setCriteria(DEFAULT_CRITERIA);
      setUsesFallback(true);
      setError(loadError instanceof Error ? loadError.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const leftCompany = useMemo(
    () => companies.find((company) => company.id === leftId),
    [companies, leftId],
  );
  const rightCompany = useMemo(
    () => companies.find((company) => company.id === rightId),
    [companies, rightId],
  );

  const swapCompanies = () => {
    setLeftId(rightId);
    setRightId(leftId);
    notify("Đã đổi vị trí hai công ty.", "info");
  };

  return (
    <motion.section
      className="page-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="shell">
        <div className="page-hero">
          <div>
            <span className="eyebrow">DYNAMIC COMPARISON</span>
            <h1>So sánh theo tiêu chí thật</h1>
            <p>
              Bảng tự động dùng tiêu chí và trọng số Admin đang cấu hình trong PostgreSQL.
              Tiêu chí frontend mặc định chỉ được dùng khi API trả về danh sách rỗng.
            </p>
          </div>
          <span className="page-hero__icon"><ArrowLeftRight size={29} /></span>
        </div>

        {usesFallback && (
          <div className="comparison-notice">
            <AlertCircle size={15} />
            Đang dùng bộ tiêu chí mặc định phía Frontend.
          </div>
        )}

        <div className="compare-picker">
          <label>
            <span>CÔNG TY A</span>
            <span className="select-wrap">
              <select value={leftId} onChange={(event) => setLeftId(event.target.value)}>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
          <button className="swap-button" type="button" onClick={swapCompanies} disabled={!companies.length}>
            <ArrowLeftRight size={17} />
          </button>
          <label>
            <span>CÔNG TY B</span>
            <span className="select-wrap">
              <select value={rightId} onChange={(event) => setRightId(event.target.value)}>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </span>
          </label>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="journey-spinner comparison-spinner" />
            <h3>Đang tải dữ liệu so sánh</h3>
            <p>Companies và EvaluationCriteria đang được lấy từ FastAPI.</p>
          </div>
        ) : error || !companies.length ? (
          <div className="empty-state">
            <AlertCircle size={34} />
            <h3>Chưa có dữ liệu công ty</h3>
            <p>{error || "Admin chưa thêm công ty hoạt động."}</p>
            <button className="button-secondary retry-button" type="button" onClick={loadData}>
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        ) : (
          <>
            <motion.div className="comparison-card" layout>
              <div className="comparison-grid-row comparison-head">
                <div><span>TIÊU CHÍ ĐỘNG</span></div>
                <div><CompanyHeader company={leftCompany} /></div>
                <div><CompanyHeader company={rightCompany} /></div>
              </div>
              {criteria.map((criterion, index) => {
                const CriterionIcon = ICONS[criterion.key] || SlidersHorizontal;
                return (
                  <motion.div
                    className="comparison-grid-row comparison-data-row"
                    key={criterion.id || criterion.key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <div>
                      <CriterionIcon size={15} />
                      <span>
                        {criterion.label}
                        <small className="criterion-weight">
                          {Math.round(Number(criterion.weight || 0) * 100)}%
                        </small>
                      </span>
                    </div>
                    <div>{criterionValue(leftCompany, criterion.key)}</div>
                    <div>{criterionValue(rightCompany, criterion.key)}</div>
                  </motion.div>
                );
              })}
              <div className="comparison-grid-row comparison-data-row">
                <div><Gauge size={15} /> Thân thiện Fresher</div>
                <div>{leftCompany?.fresher_score || 0}/5</div>
                <div>{rightCompany?.fresher_score || 0}/5</div>
              </div>
              <div className="comparison-grid-row comparison-data-row">
                <div><Building2 size={15} /> Môi trường</div>
                <div>{leftCompany?.work_environment || "Đang cập nhật"}</div>
                <div>{rightCompany?.work_environment || "Đang cập nhật"}</div>
              </div>
            </motion.div>
            <div className="insight-banner">
              <div><BriefcaseBusiness size={18} /></div>
              <span>
                <strong>Matching không dùng thông tin lương</strong>
                Điểm phù hợp tập trung vào mong muốn, kỹ năng ứng viên và yêu cầu trong JD.
              </span>
            </div>
          </>
        )}
      </div>
    </motion.section>
  );
}
