"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import EnvironmentTags from "@/components/common/EnvironmentTags";
import IssueMatchFacts from "@/components/common/IssueMatchFacts";
import SaveIssueButton from "@/components/contributions/SaveIssueButton";
import { readRecommendationScope } from "@/services/recommendationScope";
import { applyDeveloperPersona, getActivePersonaId } from "@/services/developerPersonas";
const TRACKED_REPOSITORIES = ["psf/requests", "pallets/flask", "fastapi/fastapi", "pytest-dev/pytest", "django/django", "expressjs/express", "facebook/react", "vuejs/vue", "tailwindlabs/tailwindcss", "vercel/next.js", "rust-lang/rust", "golang/go", "spring-projects/spring-boot", "torvalds/linux", "rails/rails"];

function deriveFilterOptions(issues) {
  const languages = new Set(); const labelNames = new Set(); const repoNames = new Set();
  for (const issue of issues) { if (issue.repoLanguage) languages.add(issue.repoLanguage); for (const label of issue.labels) labelNames.add(label.name); if (issue.repoFullName) repoNames.add(issue.repoFullName); }
  return { languages: [...languages].sort(), labelNames: [...labelNames].sort(), repoNames: [...repoNames].sort() };
}

function inferDifficulty(labels) {
  const names = labels.map((label) => label.name.toLowerCase());
  if (["good first issue", "beginner", "starter", "easy", "first-timers-only", "help wanted", "newcomer", "good-first-issue"].some((k) => names.some((n) => n.includes(k)))) return "Beginner";
  if (["intermediate", "medium", "moderate"].some((k) => names.some((n) => n.includes(k)))) return "Intermediate";
  if (["advanced", "hard", "complex", "expert", "senior"].some((k) => names.some((n) => n.includes(k)))) return "Advanced";
  return null;
}
import {
  Search,
  ExternalLink,
  RefreshCw,
  Tag,
  ChevronDown,
  X,
  AlertTriangle,
  Loader2,
  GitBranch,
  Filter,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function IssueCard({ issue, developerProfile }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 hover:border-white/[0.13] transition-all">
      {/* Top row: repo + issue number + difficulty */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-[#71717a] flex-wrap font-mono">
            <span className="flex items-center gap-1 text-[#a1a1aa] font-medium">
              <GitBranch className="w-3 h-3 shrink-0" />
              <span className="truncate">{issue.repoFullName}</span>
            </span>
            <span>#{issue.number}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-[#ededef] leading-snug line-clamp-2">
            {issue.title}
          </h3>
        </div>


      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${issue.eligibility?.eligible ? "bg-emerald-950/30 text-emerald-200 border-emerald-900/50" : "bg-rose-950/25 text-rose-200 border-rose-900/40"}`}>
          {issue.eligibility?.eligible ? "Eligible" : "Excluded"}
        </span>
        {issue.eligibility?.learningOpportunities?.length > 0 && <span className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-amber-900/40 bg-amber-950/20 text-amber-200">Learning opportunity</span>}
        {issue.rankingPosition && <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-violet-900/40 bg-violet-950/25 text-violet-200">Rank #{issue.rankingPosition}</span>}
        {issue.match?.score !== null && issue.match?.score !== undefined && <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-sky-900/40 bg-sky-950/25 text-sky-200">{issue.match.score}/100 match</span>}
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 3).map((label) => (
              <span
                key={label.name}
                className="text-xs font-medium px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.035] text-[#c4c4ca]"
                title={label.description || label.name}
              >
                {label.name}
              </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/[0.06] bg-[#1c1c20] text-[#8e8e93]">
              +{issue.labels.length - 3}
            </span>
          )}
        </div>
      )}

      <EnvironmentTags requirements={issue.environmentRequirements} />

      <IssueMatchFacts issue={issue} profile={developerProfile} />

      {/* Footer row: timestamps, comments, action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#8e8e93]">
        <div className="flex items-center gap-2">
          <SaveIssueButton issue={issue} />
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-[#ededef] font-semibold text-xs transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Dropdown filter ──────────────────────────────────────────────────────────

function FilterSelect({ label, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
          value
            ? "bg-[#ea6c33] text-white"
            : "bg-[#1c1c20] hover:bg-[#242428] text-[#8e8e93] hover:text-[#ededef]"
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        <span>{value || label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-20 min-w-[180px] max-h-60 overflow-y-auto rounded-xl bg-[#18181b] border border-white/[0.08] shadow-xl py-1.5">
            {value && (
              <button
                className="w-full text-left px-3.5 py-2 text-xs font-bold text-[#ea6c33] hover:bg-white/[0.04] flex items-center gap-2"
                onClick={() => { onChange(""); setOpen(false); }}
              >
                <X className="w-3.5 h-3.5" /> Clear filter
              </button>
            )}
            {options.map((opt) => (
              <button
                key={opt}
                className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors hover:bg-white/[0.04] ${
                  opt === value ? "text-[#ea6c33]" : "text-[#a1a1aa] hover:text-[#ededef]"
                }`}
                onClick={() => { onChange(opt); setOpen(false); }}
              >
                {opt}
              </button>
            ))}
            {options.length === 0 && (
              <p className="px-3.5 py-2 text-xs text-[#71717a]">No options</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const routeParamsApplied = useRef(false);
  // Fetch state
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [developerProfile, setDeveloperProfile] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterRepo, setFilterRepo] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");

  // Pagination
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Derived filter options from fetched issues
  const filterOptions = useMemo(() => deriveFilterOptions(issues), [issues]);

  useEffect(() => {
    if (warnings.length === 0) return undefined;
    const timeoutId = window.setTimeout(() => setWarnings([]), 7000);
    return () => window.clearTimeout(timeoutId);
  }, [warnings]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    setWarnings([]);
    setRateLimitHit(false);
    setVisibleCount(PAGE_SIZE);

    try {
      const savedProfile = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null");
      if (!savedProfile?.username || !savedProfile?.gitHubData) throw new Error("Connect a GitHub profile on the Profile page before evaluating issue eligibility.");
      const scope = readRecommendationScope();
      const effectiveProfile = applyDeveloperPersona(savedProfile);
      setDeveloperProfile({ ...savedProfile, skills: effectiveProfile.skills || [], experienceLevel: effectiveProfile.experienceLevel, selectedDomains: effectiveProfile.selectedDomains || [], isDemoPersona: effectiveProfile.isDemoPersona });
      const response = await fetch("/api/github/eligibility", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ username: savedProfile.username, skills: effectiveProfile.skills || [], experienceLevel: effectiveProfile.experienceLevel, selectedDomains: effectiveProfile.selectedDomains || [], personaId: getActivePersonaId(), ...scope, refresh: hasFetched }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to fetch GitHub issues.");
      setIssues(result.recommendations || result.issues);
      setDeveloperProfile((profile) => ({ ...profile, evaluatedUsername: result.profile?.username }));
      setErrors(result.errors || []);
      setWarnings(result.warnings || []);
      setRateLimitHit(result.rateLimitHit);
      setHasFetched(true);
    } catch (err) {
      setErrors([err.message || "Unexpected error while collecting issues."]);
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  }, [hasFetched]);

  useEffect(() => {
    if (routeParamsApplied.current) return;
    routeParamsApplied.current = true;
    const params = new URLSearchParams(window.location.search);
    const repo = params.get("repo") || "";
    const difficulty = params.get("difficulty") || "";
    const query = params.get("q") || "";
    setFilterRepo(repo);
    setFilterDifficulty(difficulty);
    setSearchQuery(query);
    try {
      const savedProfile = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null");
      if (savedProfile?.username && savedProfile?.gitHubData) {
        window.setTimeout(() => fetchIssues(), 0);
      }
    } catch {
      // Invalid local profile data is handled by the explicit fetch action.
    }
  }, [fetchIssues]);

  useEffect(() => {
    window.addEventListener("osmatcher-persona-change", fetchIssues);
    return () => window.removeEventListener("osmatcher-persona-change", fetchIssues);
  }, [fetchIssues]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredIssues = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return issues.filter((issue) => {
      // Search across title, body, and repo name simultaneously
      if (q) {
        const titleMatch = issue.title.toLowerCase().includes(q);
        const bodyMatch  = (issue.body ?? "").toLowerCase().includes(q);
        const repoMatch  = (issue.repoFullName ?? "").toLowerCase().includes(q);
        if (!titleMatch && !bodyMatch && !repoMatch) return false;
      }
      // Language filter — exact match on repo primary language
      if (filterLanguage && issue.repoLanguage !== filterLanguage) return false;
      // Repo filter — exact match on full repo name (owner/repo)
      if (filterRepo && issue.repoFullName !== filterRepo) return false;
      // Label filter — issue must have at least one label matching the selection
      if (filterLabel && !issue.labels.some((l) => l.name === filterLabel)) return false;
      // Difficulty filter — derived from labels, null means unknown; excluded if no match
      const difficulty = issue.requirementExtraction?.estimatedDifficulty?.value || inferDifficulty(issue.labels) || "Unknown";
      if (filterDifficulty && difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [issues, searchQuery, filterLanguage, filterLabel, filterRepo, filterDifficulty]);

  const visibleIssues = filteredIssues.slice(0, visibleCount);
  const hasMore = visibleCount < filteredIssues.length;

  // Count every active filter including search text
  const activeFiltersCount = [
    searchQuery.trim(),
    filterLanguage,
    filterLabel,
    filterRepo,
    filterDifficulty,
  ].filter(Boolean).length;

  function clearAllFilters() {
    setFilterLanguage("");
    setFilterLabel("");
    setFilterRepo("");
    setFilterDifficulty("");
    setSearchQuery("");
    setVisibleCount(PAGE_SIZE); // Reset pagination so all matching results are visible
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#202024]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ededef]">Explore Issues</h1>
        </div>

        <button
          type="button"
          onClick={fetchIssues}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ea6c33] hover:bg-[#d45f28] disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {loading ? "Fetching issues…" : hasFetched ? "Refresh" : "Fetch Issues"}
        </button>
      </div>

      {/* Errors / rate limit banner */}
      {(errors.length > 0 || rateLimitHit) && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            {rateLimitHit && (
              <p className="font-bold">
                GitHub API request failed. Check the server-side GITHUB_TOKEN configuration or retry after the rate limit resets.
              </p>
            )}
            {errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-2.5 text-xs text-[#8e8e93]">
          <div className="space-y-1">
            {warnings.map((warning, index) => <p key={`${index}-${warning}`}>{warning}</p>)}
          </div>
          <button type="button" onClick={() => setWarnings([])} aria-label="Dismiss information" className="shrink-0 rounded-md p-1 text-[#71717a] hover:text-[#ededef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea6c33]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search + Filters — shown as soon as a fetch has completed */}
      {hasFetched && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#8e8e93] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Search titles, descriptions or repository names…"
              className="w-full bg-[#1c1c20] text-base text-[#ededef] pl-12 pr-12 py-4 rounded-2xl border border-white/[0.06] placeholder-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#ea6c33]/40 focus:border-[#ea6c33]/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#ededef] cursor-pointer"
                onClick={() => { setSearchQuery(""); setVisibleCount(PAGE_SIZE); }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Repository language"
              options={filterOptions.languages}
              value={filterLanguage}
              onChange={(v) => { setFilterLanguage(v); setVisibleCount(PAGE_SIZE); }}
            />
            <FilterSelect
              label="Difficulty"
              options={["Beginner", "Intermediate", "Advanced", "Unknown"]}
              value={filterDifficulty}
              onChange={(v) => { setFilterDifficulty(v); setVisibleCount(PAGE_SIZE); }}
            />
            <FilterSelect
              label="Label"
              options={filterOptions.labelNames}
              value={filterLabel}
              onChange={(v) => { setFilterLabel(v); setVisibleCount(PAGE_SIZE); }}
            />
            <FilterSelect
              label="Repository"
              options={filterOptions.repoNames}
              value={filterRepo}
              onChange={(v) => { setFilterRepo(v); setVisibleCount(PAGE_SIZE); }}
            />

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-xs font-bold text-[#71717a] hover:text-[#ededef] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear all ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Live results count */}
          <p className="text-[11px] text-[#71717a] font-mono">
            {filteredIssues.length === issues.length
              ? `${issues.length.toLocaleString()} eligible recommendations`
              : `${filteredIssues.length.toLocaleString()} of ${issues.length.toLocaleString()} recommendations match`}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 animate-pulse space-y-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-3 bg-white/[0.06] rounded w-1/3" />
              <div className="h-4 bg-white/[0.08] rounded w-3/4" />
              <div className="flex gap-2">
                <div className="h-5 bg-white/[0.05] rounded-xl w-20" />
                <div className="h-5 bg-white/[0.05] rounded-xl w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty / not-yet-fetched state */}
      {!loading && !hasFetched && (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1c1c20] flex items-center justify-center mx-auto">
            <GitBranch className="w-6 h-6 text-[#71717a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#ededef]">No issues loaded yet</p>
            <p className="text-xs text-[#71717a] mt-1 max-w-sm mx-auto">
              Connect a GitHub username on the Profile page to collect real issues and evaluate eligibility.
            </p>
          </div>
        </div>
      )}

      {/* No results after filtering */}
      {!loading && hasFetched && filteredIssues.length === 0 && issues.length > 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-[#ededef]">No matching issues</p>
          <p className="text-xs text-[#71717a]">
            No issues match your current filters. Try adjusting the search or filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-xs font-bold text-[#ededef] transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {!loading && hasFetched && issues.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-[#ededef]">No eligible recommendations available</p>
          <p className="text-xs text-[#71717a]">No usable open issues were returned for the tracked repositories. Refresh to try again later.</p>
        </div>
      )}

      {/* Issue grid */}
      {!loading && visibleIssues.length > 0 && (
        <div className="space-y-5">
          {visibleIssues.map((issue) => (
            <IssueCard key={`${issue.repoFullName}-${issue.id}`} issue={issue} developerProfile={developerProfile} />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-xs font-bold text-[#ededef] transition-colors cursor-pointer"
              >
                Load more ({filteredIssues.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tracked repos info panel */}
      {!loading && (
        <div className="glass-panel rounded-2xl p-5 space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#71717a]" />
            <span className="text-xs font-bold text-[#ededef]">Tracked Repositories ({TRACKED_REPOSITORIES.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRACKED_REPOSITORIES.map((repo) => (
              <button
                key={repo}
                type="button"
                onClick={() => {
                  setFilterRepo((current) => current === repo ? "" : repo);
                  setVisibleCount(PAGE_SIZE);
                  if (!hasFetched && !loading) fetchIssues();
                }}
                aria-pressed={filterRepo === repo}
                className={`text-xs font-mono font-bold px-3 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea6c33] ${filterRepo === repo ? "bg-[#ea6c33] text-white" : "bg-[#1c1c20] hover:bg-[#242428] text-[#8e8e93] hover:text-[#ededef]"}`}
              >
                {repo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

