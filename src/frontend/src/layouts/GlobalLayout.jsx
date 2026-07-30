"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight,
  Bot,
  FileText,
  Home,
  Menu,
  Moon,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import FloatingAIChat from "../components/FloatingAIChat";

const NAV_ITEMS = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "comparison", label: "So sánh Tech Stack", icon: ArrowLeftRight },
  { id: "portfolio", label: "Portfolio cá nhân", icon: FileText },
];

function Brand({ onClick }) {
  return (
    <button className="logo-button" type="button" onClick={onClick}>
      <span className="brand-lockup">
        <span className="brand-mark">V<Bot size={12} /></span>
        <span className="brand-copy">
          <strong>VinCareer <em>AI</em></strong>
          <span>Sinh viên edition</span>
        </span>
      </span>
    </button>
  );
}

export default function GlobalLayout({
  activePage,
  onNavigate,
  portfolioId,
  toast,
  notify,
  children,
}) {
  const [isDark, setIsDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (page) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <div className={`app ${isDark ? "app--dark" : ""}`}>
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <header className="topbar">
        <div className="shell topbar__inner">
          <Brand onClick={() => navigate("home")} />
          <nav className="desktop-nav" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activePage === item.id ? "nav-item--active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                {item.label}
                {activePage === item.id && (
                  <motion.i
                    className="nav-underline"
                    layoutId="navigation-underline"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </nav>
          <div className="topbar__actions">
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsDark((current) => !current)}
              aria-label="Đổi giao diện sáng tối"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="icon-button mobile-menu-button"
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label="Mở menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              className="mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {NAV_ITEMS.map((item) => (
                <button
                  className={`mobile-nav__item ${activePage === item.id ? "is-active" : ""}`}
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                >
                  <item.icon size={16} /> {item.label}
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="shell footer__inner">
          <Brand onClick={() => navigate("home")} />
          <p>© 2026 VinCareer Insight AI · Dữ liệu tuyển dụng được quản lý từ Backend.</p>
          <button type="button" onClick={() => notify("Agent luôn sẵn sàng ở góc phải.", "info")}>
            <Sparkles size={13} /> Trợ lý AI toàn cục
          </button>
        </div>
      </footer>

      <nav className="bottom-nav" aria-label="Điều hướng di động">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "is-active" : ""}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={16} /><span>{item.label}</span>
          </button>
        ))}
      </nav>

      <FloatingAIChat
        portfolioId={portfolioId}
        onNavigate={navigate}
        notify={notify}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <Sparkles size={15} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
