"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import GlobalLayout from "./layouts/GlobalLayout";
import ComparisonPage from "./views/ComparisonPage";
import HomePage from "./views/HomePage";
import Portfolio from "./views/Portfolio";
import { careerApi } from "./services/apiClient";

const PAGE_QUERY = {
  home: "",
  comparison: "comparison",
  portfolio: "portfolio",
};

function pageFromUrl() {
  if (typeof window === "undefined") return "home";
  const value = new URLSearchParams(window.location.search).get("view");
  return Object.values(PAGE_QUERY).includes(value) && value ? value : "home";
}

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [portfolio, setPortfolio] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    const handlePopState = () => setActivePage(pageFromUrl());
    queueMicrotask(handlePopState);
    window.addEventListener("popstate", handlePopState);

    const storedPortfolioId = window.localStorage.getItem("vincareer_portfolio_id");
    if (storedPortfolioId) {
      careerApi
        .getPortfolio(storedPortfolioId)
        .then(setPortfolio)
        .catch(() => window.localStorage.removeItem("vincareer_portfolio_id"));
    }
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const notify = (message, type = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ id: crypto.randomUUID(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  };

  const navigate = (page) => {
    const safePage = PAGE_QUERY[page] !== undefined ? page : "home";
    const url = new URL(window.location.href);
    if (safePage === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", safePage);
    window.history.pushState({}, "", url);
    setActivePage(safePage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePortfolioReady = (nextPortfolio) => {
    setPortfolio(nextPortfolio);
    if (nextPortfolio?.id) {
      window.localStorage.setItem("vincareer_portfolio_id", nextPortfolio.id);
    }
  };

  return (
    <GlobalLayout
      activePage={activePage}
      onNavigate={navigate}
      portfolioId={portfolio?.id}
      toast={toast}
      notify={notify}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activePage === "comparison" ? (
            <ComparisonPage notify={notify} />
          ) : activePage === "portfolio" ? (
            <Portfolio
              portfolio={portfolio}
              onPortfolioReady={handlePortfolioReady}
              notify={notify}
            />
          ) : (
            <HomePage onNavigate={navigate} />
          )}
        </motion.div>
      </AnimatePresence>
    </GlobalLayout>
  );
}
