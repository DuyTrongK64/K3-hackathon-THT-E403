"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight,
  Bot,
  Building2,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";
import FloatingAIChat from "../components/FloatingAIChat";

const BASE_NAV_ITEMS = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "companies", label: "Danh sách công ty", icon: Building2 },
  { id: "comparison", label: "So sánh Tech Stack", icon: ArrowLeftRight },
  { id: "top-matches", label: "Top công ty phù hợp", icon: Target },
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
  onSearch,
  user,
  onLogout,
  portfolioId,
  toast,
  notify,
  children,
}) {
  const [isDark, setIsDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navItems = user?.role === "admin"
    ? [...BASE_NAV_ITEMS, { id: "admin", label: "Quản trị", icon: ShieldCheck }]
    : BASE_NAV_ITEMS;

  const navigate = (page) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!search.trim()) return;
    onSearch(search.trim());
    setSearch("");
  };

  return (
    <div className={`app ${isDark ? "app--dark" : ""}`}>
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <header className="topbar">
        <div className="shell topbar__inner">
          <Brand onClick={() => navigate("home")} />
          <nav className="desktop-nav" aria-label="Điều hướng chính">
            {navItems.map((item) => (
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
            <form className="global-search" onSubmit={handleSearch}>
              <Search size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm công ty, vị trí..."
                aria-label="Tra cứu nhanh"
              />
            </form>
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsDark((current) => !current)}
              aria-label="Đổi giao diện sáng tối"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className={`user-chip ${activePage === "portfolio" ? "is-active" : ""}`}
              type="button"
              title={`${user?.email} · Xem Portfolio cá nhân`}
              onClick={() => navigate("portfolio")}
              aria-label="Mở Portfolio cá nhân"
            >
              <UserRound size={14} />
              <span><strong>{user?.full_name}</strong><small>{user?.role}</small></span>
            </button>
            <button className="icon-button" type="button" onClick={onLogout} aria-label="Đăng xuất">
              <LogOut size={16} />
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
              style={{ "--nav-count": navItems.length }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {navItems.map((item) => (
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

      <nav
        className="bottom-nav"
        style={{ "--nav-count": navItems.length }}
        aria-label="Điều hướng di động"
      >
        {navItems.map((item) => (
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
