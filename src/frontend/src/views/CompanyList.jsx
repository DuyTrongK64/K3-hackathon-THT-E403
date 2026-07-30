"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  Code2,
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
}) {
  const [search, setSearch] = useState(initialSearch);
  const [division, setDivision] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState(null);

  const divisions = useMemo(
    () => ["all", ...new Set(companies.map((company) => company.division))],
    [companies],
  );
  const interestCounts = useMemo(
    () => new Map(
      interestStatuses.map((item) => [
        item.company_id,
        item.interest_count || 0,
      ]),
    ),
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
            {filtered.map((company, index) => (
              <motion.button
                className="company-card"
                style={{ "--company-accent": index % 2 ? "#06b6d4" : "#0878e6" }}
                key={company.id}
                type="button"
                onClick={() => setSelectedCompany(company)}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
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
                  <span className="company-interest-count">
                    <Users size={12} />
                    <strong>{interestCounts.get(company.id) || 0}</strong>
                    <small>người quan tâm</small>
                  </span>
                </div>
                <div className="company-card-meta">
                  <span><MapPin size={11} /> {company.locations?.join(" · ")}</span>
                  <span><Code2 size={11} /> {company.jd_data?.length || 0} project teams</span>
                </div>
              </motion.button>
            ))}
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
