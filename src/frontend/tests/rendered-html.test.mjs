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
  const [api, comparison, portfolio] = await Promise.all([
    readFile(new URL("src/services/apiClient.js", root), "utf8"),
    readFile(new URL("src/views/ComparisonPage.jsx", root), "utf8"),
    readFile(new URL("src/views/Portfolio.jsx", root), "utf8"),
  ]);

  assert.match(api, /NEXT_PUBLIC_API_BASE_URL/);
  assert.match(api, /\/portfolios\/scan/);
  assert.match(comparison, /DEFAULT_CRITERIA/);
  assert.match(comparison, /careerApi\.listCriteria/);
  assert.match(portfolio, /careerApi\.scanCVFile/);
});
