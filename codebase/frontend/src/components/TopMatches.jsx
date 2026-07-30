"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Heart,
  Target,
  Users,
} from "lucide-react";

export default function TopMatches({
  matches,
  onExplore,
  interestStatuses = [],
  onToggleInterest,
  notify,
}) {
  if (!matches?.length) return null;
  const selectedCount = interestStatuses.filter((item) => item.is_interested).length;
  const statuses = new Map(
    interestStatuses.map((item) => [item.company_id, item]),
  );

  const handleInterest = (match, status) => {
    if (!status?.is_interested && selectedCount >= 3) {
      notify(
        "Bạn chỉ có thể quan tâm tối đa 3 công ty. Hãy bỏ quan tâm một công ty trước.",
        "error",
      );
      return;
    }
    onToggleInterest(match.company_id);
  };

  return (
    <section className="top-matches-section">
      <header className="match-result-header">
        <span><Target size={18} /></span>
        <div><small>TOOL MATCHING</small><h3>Các công ty phù hợp với hồ sơ</h3></div>
      </header>
      <div className="match-result-list">
        {matches.map((match, index) => {
          const status = statuses.get(match.company_id) || {
            interest_count: 0,
            is_interested: false,
          };
          const atLimit = !status.is_interested && selectedCount >= 3;
          return (
            <motion.article
              className="match-result-card match-result-card--unranked"
              key={match.company_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="match-result-card__body">
                <small><Building2 size={11} /> {match.company_slug}</small>
                <h4>{match.company_name}</h4>
                {match.reasons?.map((reason) => (
                  <p key={reason}><CheckCircle2 size={11} /> {reason}</p>
                ))}
                <span className="interest-count">
                  <Users size={12} />
                  {status.interest_count || 0} người quan tâm
                </span>
              </div>
              <div className="match-card-actions">
                <button
                  className={`interest-button ${status.is_interested ? "is-active" : ""}`}
                  type="button"
                  aria-pressed={status.is_interested}
                  aria-disabled={atLimit}
                  title={atLimit ? "Đã đạt giới hạn 3 công ty" : undefined}
                  onClick={() => handleInterest(match, status)}
                >
                  <Heart size={13} fill={status.is_interested ? "currentColor" : "none"} />
                  {status.is_interested ? "Đã quan tâm" : "Quan tâm"}
                </button>
                <button type="button" onClick={() => onExplore(match)}>
                  Chi tiết <ArrowRight size={13} />
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
