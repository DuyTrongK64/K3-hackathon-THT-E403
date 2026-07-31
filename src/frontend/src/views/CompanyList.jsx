"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  Code2,
  Heart,
  MapPin,
  Search,
  Star,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import CompanyDetail from "../components/CompanyDetail";

export default function CompanyList({
  companies,
  initialSearch = "",
  interestStatuses = [],
  onToggleInterest,
  notify,
}) {
  const [search, setSearch] = useState(initialSearch);
  const [division, setDivision] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [updatingInterestId, setUpdatingInterestId] = useState(null);

  const divisions = useMemo(
    () => ["all", ...new Set(companies.map((company) => company.division))],
    [companies],
  );
  const interestByCompany = useMemo(
    () => new Map(
      interestStatuses.map((item) => [item.company_id, item]),
    ),
    [interestStatuses],
  );
  const selectedInterestCount = useMemo(
    () => interestStatuses.filter((item) => item.is_interested).length,
    [interestStatuses],
  );
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return companies.filter((company) => {
      const haystack = [
        company.name,
        company.division,
        company.description,
        ...(company.tech_stack || []),
        ...(company.jd_data || []).flatMap((job) => [job.position, job.team_name, job.department]),
      ].join(" ").toLowerCase();
      return (division === "all" || company.division === division) && haystack.includes(keyword);
    });
  }, [companies, division, search]);

  const handleInterest = async (company, status) => {
    if (updatingInterestId) return;
    if (!status.is_interested && selectedInterestCount >= 3) {
      notify?.(
        "Bạn chỉ có thể quan tâm tối đa 3 công ty. Hãy bỏ quan tâm một công ty trước.",
        "error",
      );
      return;
    }
    if (!onToggleInterest) return;
    setUpdatingInterestId(company.id);
    try {
      await onToggleInterest(company.id);
    } finally {
      setUpdatingInterestId(null);
    }
  };

  return (
    <motion.section className="page-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="shell">
        <div className="page-hero">
          <div>
            <span className="eyebrow">COMPANY DIRECTORY</span>
            <h1>Khám phá công ty & project team</h1>
            <p>Tra cứu định hướng, yêu cầu, tech stack và môi trường từ PostgreSQL.</p>
          </div>
          <span className="page-hero__icon"><Building2 size={29} /></span>
        </div>

        <div className="company-directory-toolbar">
          <label className="team-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm công ty, vị trí, team hoặc kỹ năng..."
            />
          </label>
          <div className="company-filter">
            {divisions.map((item) => (
              <button
                key={item}
                type="button"
                className={division === item ? "is-active" : ""}
                onClick={() => setDivision(item)}
              >
                {item === "all" ? "Tất cả" : item}
              </button>
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="company-grid">
            {filtered.map((company, index) => {
              const status = interestByCompany.get(company.id) || {
                company_id: company.id,
                interest_count: 0,
                is_interested: false,
              };
              const atLimit = !status.is_interested && selectedInterestCount >= 3;
              const isUpdating = updatingInterestId === company.id;
              return (
                <motion.article
                  className="company-card"
                  style={{ "--company-accent": index % 2 ? "#06b6d4" : "#0878e6" }}
                  key={company.id}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className="company-card__details"
                    type="button"
                    aria-label={`Xem chi tiết ${company.name}`}
                    onClick={() => setSelectedCompany(company)}
                  >
                    <div className="company-card__top">
                      <span className="company-logo company-logo--api">{company.name.slice(0, 2).toUpperCase()}</span>
                      <span className="division-badge">{company.division}</span>
                      <span className="card-arrow"><ArrowRight size={14} /></span>
                    </div>
                    <h3>{company.name}</h3>
                    <p>{company.description}</p>
                    <div className="tech-stack">
                      {(company.tech_stack || []).slice(0, 6).map((tech) => <span key={tech}>{tech}</span>)}
                    </div>
                    <div className="company-card__footer">
                      <span className="fresher-rating">
                        <Star size={12} fill="currentColor" />
                        <strong>{company.fresher_score}</strong><small>/ 5 Fresher</small>
                      </span>
                    </div>
                    <div className="company-card-meta">
                      <span><MapPin size={11} /> {company.locations?.join(" · ")}</span>
                      <span><Code2 size={11} /> {company.jd_data?.length || 0} project teams</span>
                    </div>
                  </button>
                  <div className="company-card__interest-actions">
                    <span className="company-interest-count">
                      <Users size={12} />
                      <strong>{status.interest_count || 0}</strong>
                      <small>người quan tâm</small>
                    </span>
                    <button
                      className={`company-interest-button ${status.is_interested ? "is-active" : ""}`}
                      type="button"
                      aria-pressed={status.is_interested}
                      aria-disabled={atLimit}
                      disabled={isUpdating}
                      title={atLimit ? "Đã đạt giới hạn 3 công ty" : undefined}
                      onClick={() => handleInterest(company, status)}
                    >
                      <Heart size={13} fill={status.is_interested ? "currentColor" : "none"} />
                      {isUpdating
                        ? "Đang lưu..."
                        : status.is_interested
                          ? "Đã quan tâm"
                          : "Quan tâm"}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="journey-empty-state">
            <Search size={34} /><h3>Không tìm thấy kết quả</h3>
            <p>Thử tên công ty, vị trí hoặc kỹ năng khác.</p>
            <button type="button" onClick={() => { setSearch(""); setDivision("all"); }}>Xóa bộ lọc</button>
          </div>
        )}
      </div>

      {selectedCompany && (
        <CompanyDetail company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </motion.section>
  );
}
