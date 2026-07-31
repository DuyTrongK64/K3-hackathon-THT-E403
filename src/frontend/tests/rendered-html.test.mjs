import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("renders the global floating agent instead of a dedicated chat page", async () => {
  const [app, layout, chat] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/layouts/GlobalLayout.jsx", root), "utf8"),
    readFile(new URL("src/components/FloatingAIChat.jsx", root), "utf8"),
  ]);

  assert.doesNotMatch(app, /activePage === ["']chat["']/);
  assert.match(layout, /<FloatingAIChat/);
  assert.match(chat, /floating-chat-messages/);
  assert.match(chat, /careerApi\.chat/);
});

test("uses backend APIs and keeps criteria fallback", async () => {
  const [api, comparison, portfolio, upload] = await Promise.all([
    readFile(new URL("src/services/apiClient.js", root), "utf8"),
    readFile(new URL("src/views/ComparisonPage.jsx", root), "utf8"),
    readFile(new URL("src/views/Portfolio.jsx", root), "utf8"),
    readFile(new URL("src/components/CVUploadForm.jsx", root), "utf8"),
  ]);

  assert.match(api, /NEXT_PUBLIC_API_BASE_URL/);
  assert.match(api, /\/portfolios\/scan/);
  assert.match(comparison, /DEFAULT_CRITERIA/);
  assert.match(comparison, /careerApi\.listCriteria/);
  assert.match(portfolio, /<CVUploadForm/);
  assert.doesNotMatch(portfolio, /<TopMatches/);
  assert.match(upload, /careerApi\.scanCVFile/);
});

test("preserves auth, company detail and top matching routes", async () => {
  const [app, api, login, companies, detail, matches, topPage, layout, admin] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/services/apiClient.js", root), "utf8"),
    readFile(new URL("src/views/LoginPage.jsx", root), "utf8"),
    readFile(new URL("src/views/CompanyList.jsx", root), "utf8"),
    readFile(new URL("src/components/CompanyDetail.jsx", root), "utf8"),
    readFile(new URL("src/components/TopMatches.jsx", root), "utf8"),
    readFile(new URL("src/views/TopCompaniesPage.jsx", root), "utf8"),
    readFile(new URL("src/layouts/GlobalLayout.jsx", root), "utf8"),
    readFile(new URL("src/views/AdminPage.jsx", root), "utf8"),
  ]);

  assert.match(app, /authStatus/);
  assert.match(app, /visiblePage === "companies"/);
  assert.match(api, /Authorization: `Bearer/);
  assert.match(api, /\/auth\/register/);
  assert.match(api, /\/matches\/top\//);
  assert.match(api, /getCompanyAnalysis/);
  assert.match(login, /careerApi\.login/);
  assert.match(companies, /<CompanyDetail/);
  assert.match(companies, /người quan tâm/);
  assert.match(companies, /interestByCompany\.get\(company\.id\)/);
  assert.match(companies, /onToggleInterest/);
  assert.match(companies, /selectedInterestCount >= 3/);
  assert.match(companies, /company-interest-button/);
  assert.match(app, /onToggleInterest=\{handleToggleInterest\}/);
  assert.match(detail, /careerApi\.getCompanyAnalysis/);
  assert.doesNotMatch(detail, /Lộ trình phỏng vấn|Điểm cộng|Điểm trừ/);
  assert.match(matches, /người quan tâm/);
  assert.match(matches, /onToggleInterest/);
  assert.doesNotMatch(matches, /match\.score|score_detail|match-rank|match-score/);
  assert.doesNotMatch(companies, /slots/);
  assert.match(topPage, /<CVUploadForm/);
  assert.match(topPage, /<TopMatches/);
  assert.match(layout, /id: "top-matches"/);
  assert.match(layout, /onClick=\{\(\) => navigate\("portfolio"\)\}/);
  assert.match(admin, /careerApi\.createCompany/);
  assert.match(admin, /careerApi\.updateCriterion/);
});

test("persists interests and exposes the three-company limit flow", async () => {
  const [app, api, matches] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/services/apiClient.js", root), "utf8"),
    readFile(new URL("src/components/TopMatches.jsx", root), "utf8"),
  ]);
  assert.match(api, /listInterests/);
  assert.match(api, /followCompany/);
  assert.match(api, /unfollowCompany/);
  assert.match(app, /handleToggleInterest/);
  assert.match(matches, /selectedCount >= 3/);
  assert.match(matches, /aria-disabled=\{atLimit\}/);
});

test("renames the legacy pipeline label", async () => {
  const home = await readFile(new URL("src/views/HomePage.jsx", root), "utf8");
  assert.doesNotMatch(home, /CAREER PIPELINE/);
  assert.match(home, /Danh sách công ty/);
});
