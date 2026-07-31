"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bot } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import GlobalLayout from "./layouts/GlobalLayout";
import {
  ApiError,
  careerApi,
  getAccessToken,
  setAccessToken,
} from "./services/apiClient";
import AdminPage from "./views/AdminPage";
import CompanyList from "./views/CompanyList";
import ComparisonPage from "./views/ComparisonPage";
import HomePage from "./views/HomePage";
import LoginPage from "./views/LoginPage";
import Portfolio from "./views/Portfolio";
import TopCompaniesPage from "./views/TopCompaniesPage";

const PAGE_QUERY = {
  home: "",
  companies: "companies",
  comparison: "comparison",
  "top-matches": "top-matches",
  portfolio: "portfolio",
  admin: "admin",
};

function pageFromUrl() {
  if (typeof window === "undefined") return "home";
  const value = new URLSearchParams(window.location.search).get("view");
  return Object.values(PAGE_QUERY).includes(value) && value ? value : "home";
}

export default function App() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [portfolio, setPortfolio] = useState(null);
  const [matches, setMatches] = useState([]);
  const [interestStatuses, setInterestStatuses] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ id: crypto.randomUUID(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  const loadCompanies = useCallback(async () => {
    const data = await careerApi.listCompanies();
    setCompanies(Array.isArray(data) ? data : []);
  }, []);

  const loadPortfolioAndMatches = useCallback(async () => {
    try {
      const latest = await careerApi.getMyLatestPortfolio();
      setPortfolio(latest);
      const matchData = await careerApi.getTopMatches(latest.id);
      setMatches(Array.isArray(matchData) ? matchData : []);
    } catch (error) {
      if (error instanceof ApiError && error.code === "PORTFOLIO_NOT_FOUND") {
        setPortfolio(null);
        setMatches([]);
        return;
      }
      throw error;
    }
  }, []);

  const loadInterests = useCallback(async () => {
    const data = await careerApi.listInterests();
    setInterestStatuses(Array.isArray(data) ? data : []);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      window.history.replaceState({}, "", url);
    }
    setUser(null);
    setCompanies([]);
    setPortfolio(null);
    setMatches([]);
    setInterestStatuses([]);
    setActivePage("home");
    setAuthStatus("guest");
  }, []);

  useEffect(() => {
    const handlePopState = () => setActivePage(pageFromUrl());
    const handleUnauthorized = () => clearSession();
    queueMicrotask(handlePopState);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("vincareer:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("vincareer:unauthorized", handleUnauthorized);
    };
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      if (!getAccessToken()) {
        if (!cancelled) setAuthStatus("guest");
        return;
      }
      try {
        const currentUser = await careerApi.me();
        if (cancelled) return;
        setUser(currentUser);
        setAuthStatus("authenticated");
        await Promise.all([
          loadCompanies(),
          loadPortfolioAndMatches(),
          loadInterests(),
        ]);
      } catch {
        if (!cancelled) clearSession();
      }
    };
    const timer = window.setTimeout(restore, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [clearSession, loadCompanies, loadInterests, loadPortfolioAndMatches]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const navigate = useCallback((page) => {
    const requestedPage = PAGE_QUERY[page] !== undefined ? page : "home";
    const safePage = requestedPage === "admin" && user?.role !== "admin"
      ? "home"
      : requestedPage;
    const url = new URL(window.location.href);
    if (safePage === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", safePage);
    window.history.pushState({}, "", url);
    setActivePage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user?.role]);

  const handleAuthenticated = async (currentUser) => {
    setUser(currentUser);
    setAuthStatus("authenticated");
    setActivePage("home");
    try {
      await Promise.all([
        loadCompanies(),
        loadPortfolioAndMatches(),
        loadInterests(),
      ]);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không tải được dữ liệu tài khoản.", "error");
    }
  };

  const handleSearch = (query) => {
    setCompanySearch(query);
    navigate("companies");
  };

  const handlePortfolioReady = async (nextPortfolio) => {
    setPortfolio(nextPortfolio);
    const nextMatches = await careerApi.getTopMatches(nextPortfolio.id);
    setMatches(Array.isArray(nextMatches) ? nextMatches : []);
    notify("Đã lưu Portfolio và hoàn tất Top 3 Matching.", "success");
  };

  const handleExploreMatch = (match) => {
    setCompanySearch(match.company_name);
    navigate("companies");
  };

  const handleToggleInterest = async (companyId) => {
    const current = interestStatuses.find(
      (item) => item.company_id === companyId,
    );
    try {
      const next = current?.is_interested
        ? await careerApi.unfollowCompany(companyId)
        : await careerApi.followCompany(companyId);
      setInterestStatuses((items) => {
        const exists = items.some((item) => item.company_id === companyId);
        if (!exists) return [...items, next];
        return items.map((item) => (
          item.company_id === companyId ? next : item
        ));
      });
      notify(
        next.is_interested
          ? "Đã thêm công ty vào danh sách quan tâm."
          : "Đã bỏ quan tâm công ty.",
        "success",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Không thể cập nhật quan tâm.",
        "error",
      );
    }
  };

  if (authStatus === "checking") {
    return (
      <div className="app auth-loading">
        <span className="brand-mark">V<Bot size={12} /></span>
        <span className="journey-spinner comparison-spinner" />
        <p>Đang khôi phục phiên VinCareer...</p>
      </div>
    );
  }

  if (authStatus !== "authenticated" || !user) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  const visiblePage = activePage === "admin" && user.role !== "admin"
    ? "home"
    : activePage;

  return (
    <GlobalLayout
      activePage={visiblePage}
      onNavigate={navigate}
      onSearch={handleSearch}
      user={user}
      onLogout={clearSession}
      portfolioId={portfolio?.id}
      toast={toast}
      notify={notify}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={visiblePage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {visiblePage === "companies" ? (
            <CompanyList
              key={companySearch}
              companies={companies}
              initialSearch={companySearch}
              interestStatuses={interestStatuses}
              onToggleInterest={handleToggleInterest}
              notify={notify}
            />
          ) : visiblePage === "comparison" ? (
            <ComparisonPage notify={notify} />
          ) : visiblePage === "portfolio" ? (
            <Portfolio
              portfolio={portfolio}
              onPortfolioReady={handlePortfolioReady}
              notify={notify}
            />
          ) : visiblePage === "top-matches" ? (
            <TopCompaniesPage
              portfolio={portfolio}
              matches={matches}
              onPortfolioReady={handlePortfolioReady}
              onExploreMatch={handleExploreMatch}
              interestStatuses={interestStatuses}
              onToggleInterest={handleToggleInterest}
              notify={notify}
            />
          ) : visiblePage === "admin" ? (
            <AdminPage
              notify={notify}
              onCompaniesChanged={loadCompanies}
            />
          ) : (
            <HomePage onNavigate={navigate} />
          )}
        </motion.div>
      </AnimatePresence>
    </GlobalLayout>
  );
}
