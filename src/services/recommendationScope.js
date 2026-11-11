export const TARGET_ORGANIZATIONS_KEY = "osMatcherTargetOrganizations";
export const RECOMMENDATION_MODE_KEY = "osMatcherRecommendationMode";
export const TARGET_QUICK_FILTERS_KEY = "osMatcherTargetQuickFilters";

export const QUICK_ISSUE_FILTERS = [
  "Good First Issue",
  "Help Wanted",
  "Beginner Friendly",
  "Documentation & i18n",
  "Frontend / UI",
  "Backend / API",
  "Web & Developer Tools",
];

function normalizeQuickFilter(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "documentation" ? "Documentation & i18n" : QUICK_ISSUE_FILTERS.find((filter) => filter.toLowerCase() === normalized) || null;
}

export function readRecommendationScope() {
  if (typeof window === "undefined") return { mode: "general", targetOrganizations: [], quickFilters: [] };
  let targetOrganizations = [];
  let quickFilters = [];
  try {
    const saved = JSON.parse(localStorage.getItem(TARGET_ORGANIZATIONS_KEY) || "[]");
    if (Array.isArray(saved)) targetOrganizations = saved.filter((value) => typeof value === "string");
  } catch { targetOrganizations = []; }
  try {
    const saved = JSON.parse(localStorage.getItem(TARGET_QUICK_FILTERS_KEY) || "[]");
    if (Array.isArray(saved)) quickFilters = [...new Set(saved.map(normalizeQuickFilter).filter(Boolean))];
  } catch { quickFilters = []; }
  return {
    mode: localStorage.getItem(RECOMMENDATION_MODE_KEY) === "targeted" ? "targeted" : "general",
    targetOrganizations,
    quickFilters,
  };
}

export function saveRecommendationScope(mode, targetOrganizations, quickFilters = []) {
  const cleanOrganizations = [...new Set(targetOrganizations)];
  const cleanFilters = [...new Set(quickFilters.map(normalizeQuickFilter).filter(Boolean))];
  localStorage.setItem(TARGET_ORGANIZATIONS_KEY, JSON.stringify(cleanOrganizations));
  localStorage.setItem(RECOMMENDATION_MODE_KEY, mode === "targeted" && cleanOrganizations.length ? "targeted" : "general");
  localStorage.setItem(TARGET_QUICK_FILTERS_KEY, JSON.stringify(cleanFilters));
  window.dispatchEvent(new Event("osmatcher-target-mode-change"));
}
