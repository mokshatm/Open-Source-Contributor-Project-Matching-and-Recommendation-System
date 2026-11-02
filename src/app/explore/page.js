"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  MessageSquare,
  Clock,
  Star,
  Tag,
  ChevronDown,
  X,
  AlertTriangle,
  Loader2,
  GitBranch,
  Filter,
} from "lucide-react";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function timeAgo(dateString) {
  if (!dateString) return "â€”";
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function labelColor(hex) {
  if (!hex) return { bg: "bg-[#1c1c20]", text: "text-[#a1a1aa]" };
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Determine luminance to pick text color
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const textClass = luminance > 140 ? "text-[#0e0e10]" : "text-white";
  return { style: { backgroundColor: `#${hex}` }, textClass };
}

// â”€â”€â”€ Difficulty badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DifficultyBadge({ difficulty }) {
  const styles = {
    Beginner: "bg-emerald-700 text-white",
    Intermediate: "bg-sky-700 text-white",
    Advanced: "bg-amber-700 text-white",
    Unknown: "bg-[#1c1c20] text-[#a1a1aa]",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-xl ${styles[difficulty] || styles.Unknown}`}>
      {difficulty || "Unknown"}
    </span>
  );
}

function RequirementGroup({ title, items }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">{title}</h4>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.name} className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="glass-pill text-[11px] px-2 py-0.5 rounded-md">{item.name}</span>
                <span className="text-[10px] text-[#71717a]">{Math.round(item.confidence * 100)}% confidence</span>
              </div>
              {item.evidence.slice(0, 2).map((evidence, index) => (
                <p key={`${evidence.source}-${index}`} className="text-[11px] leading-relaxed text-[#8e8e93]">
                  <span className="text-[#71717a]">{evidence.source}: </span>“{evidence.text}”
                </p>
              ))}
            </li>
          ))}
        </ul>
      ) : <p className="text-[11px] text-[#71717a]">No supported requirements found.</p>}
    </div>
  );
}

function RequirementDetails({ extraction }) {
  if (!extraction || extraction.status === "unavailable") {
    return <p className="text-xs text-amber-300">Requirement extraction is unavailable for this issue.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RequirementGroup title="Programming languages" items={extraction.programmingLanguages} />
        <RequirementGroup title="Frameworks and libraries" items={extraction.frameworks} />
        <RequirementGroup title="Databases" items={extraction.databases} />
        <RequirementGroup title="Technical concepts" items={extraction.technicalConcepts} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/[0.06] pt-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#71717a]">Domain</span>
          <p className="text-xs text-[#ededef] mt-1">{extraction.domain.primary}</p>
          {extraction.domain.evidence.slice(0, 2).map((evidence, index) => (
            <p key={`domain-${index}`} className="text-[11px] text-[#8e8e93] mt-1">{evidence.source}: “{evidence.text}”</p>
          ))}
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#71717a]">Task category</span>
          <p className="text-xs text-[#ededef] mt-1">{extraction.taskCategory.value}</p>
          {extraction.taskCategory.evidence.slice(0, 2).map((evidence, index) => (
            <p key={`task-${index}`} className="text-[11px] text-[#8e8e93] mt-1">{evidence.source}: “{evidence.text}”</p>
          ))}
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-[#71717a]">Preliminary difficulty</span>
          <p className="text-xs text-[#ededef] mt-1">{extraction.estimatedDifficulty.value}</p>
          {extraction.estimatedDifficulty.evidence.slice(0, 2).map((evidence, index) => (
            <p key={`difficulty-${index}`} className="text-[11px] text-[#8e8e93] mt-1">{evidence.source}: “{evidence.text}”</p>
          ))}
          <p className="text-[10px] text-[#71717a] mt-1">Rule-based estimate, not verified difficulty.</p>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Issue Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function IssueCard({ issue }) {
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const extraction = issue.requirementExtraction;
  const difficulty = extraction?.estimatedDifficulty?.value || inferDifficulty(issue.labels) || "Unknown";

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3.5 hover:border-white/[0.13] transition-all">
      {/* Top row: repo + issue number + difficulty */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-[#71717a] flex-wrap font-mono">
            <span className="flex items-center gap-1 text-[#a1a1aa] font-medium">
              <GitBranch className="w-3 h-3 shrink-0" />
              <span className="truncate">{issue.repoFullName}</span>
            </span>
            <span>#{issue.number}</span>
            {issue.repoStars != null && (
              <>
                <span>â€¢</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#ea6c33]" />
                  {issue.repoStars.toLocaleString()}
                </span>
              </>
            )}
            {issue.repoLanguage && (
              <>
                <span>â€¢</span>
                <span className="text-[#a1a1aa]">{issue.repoLanguage}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-[#ededef] leading-snug line-clamp-2">
            {issue.title}
          </h3>
        </div>

        <DifficultyBadge difficulty={difficulty} />
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 5).map((label) => {
            const { style, textClass } = labelColor(label.color);
            return (
              <span
                key={label.name}
                style={style}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${textClass}`}
                title={label.description || label.name}
              >
                {label.name}
              </span>
            );
          })}
          {issue.labels.length > 5 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#1c1c20] text-[#71717a]">
              +{issue.labels.length - 5}
            </span>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          aria-expanded={requirementsOpen}
          aria-controls={`requirements-${issue.id}`}
          onClick={() => setRequirementsOpen((open) => !open)}
          className="flex items-center gap-2 text-[11px] font-bold text-[#ea6c33] hover:text-[#f47b45] transition-colors"
        >
          <span>{requirementsOpen ? "Hide requirements" : "Explain requirements"}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${requirementsOpen ? "rotate-180" : ""}`} />
        </button>
        {requirementsOpen && (
          <div id={`requirements-${issue.id}`} className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-4">
            <RequirementDetails extraction={extraction} />
          </div>
        )}
      </div>

      {/* Footer row: timestamps, comments, action */}
      <div className="flex items-center justify-between pt-0.5 text-[11px] text-[#71717a]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated {timeAgo(issue.updatedAt)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {issue.commentsCount} {issue.commentsCount === 1 ? "comment" : "comments"}
          </span>
        </div>

        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-[#ededef] font-bold text-[11px] transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View on GitHub
        </a>
      </div>
    </div>
  );
}

// â”€â”€â”€ Dropdown filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ExplorePage() {
  // Fetch state
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

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

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    setRateLimitHit(false);
    setVisibleCount(PAGE_SIZE);

    try {
      const response = await fetch(`/api/github/issues${hasFetched ? "?refresh=1" : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to fetch GitHub issues.");
      setIssues(result.issues);
      setErrors(result.errors);
      setRateLimitHit(result.rateLimitHit);
      setHasFetched(true);
    } catch (err) {
      setErrors([err.message || "Unexpected error while collecting issues."]);
    } finally {
      setLoading(false);
    }
  }, [hasFetched]);

  // â”€â”€ Filtering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      // Language filter â€” exact match on repo primary language
      if (filterLanguage && issue.repoLanguage !== filterLanguage) return false;
      // Repo filter â€” exact match on full repo name (owner/repo)
      if (filterRepo && issue.repoFullName !== filterRepo) return false;
      // Label filter â€” issue must have at least one label matching the selection
      if (filterLabel && !issue.labels.some((l) => l.name === filterLabel)) return false;
      // Difficulty filter â€” derived from labels, null means unknown; excluded if no match
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

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#202024]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#ededef]">Explore Issues</h1>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-sky-900 text-sky-300">
              Stage 3
            </span>
          </div>
          <p className="mt-1 text-xs text-[#71717a] max-w-2xl leading-relaxed">
            Real open issues collected from {TRACKED_REPOSITORIES.length} tracked public repositories via the GitHub REST API.
            {issues.length > 0 && (
              <span className="text-[#a1a1aa]">
                {" "}Showing {filteredIssues.length.toLocaleString()} of {issues.length.toLocaleString()} collected issues.
              </span>
            )}
          </p>
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
          {loading ? "Fetching issuesâ€¦" : hasFetched ? "Refresh" : "Fetch Issues"}
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

      {/* Search + Filters â€” shown as soon as a fetch has completed */}
      {hasFetched && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Search titles, descriptions or repository namesâ€¦"
              className="w-full bg-[#1c1c20] text-xs text-[#ededef] pl-10 pr-10 py-2.5 rounded-xl placeholder-[#52525b] focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#ededef] cursor-pointer"
                onClick={() => { setSearchQuery(""); setVisibleCount(PAGE_SIZE); }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Language"
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
              ? `${issues.length.toLocaleString()} issues collected`
              : `${filteredIssues.length.toLocaleString()} of ${issues.length.toLocaleString()} issues match`}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 animate-pulse space-y-3"
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
              Click <span className="font-bold text-[#ea6c33]">Fetch Issues</span> to collect real open issues from {TRACKED_REPOSITORIES.length} tracked repositories via the GitHub REST API.
            </p>
          </div>
          <div className="text-[11px] text-[#52525b] font-mono">
            Unauthenticated: 60 req/hr Â· Authenticated: 5,000 req/hr
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

      {/* Issue grid */}
      {!loading && visibleIssues.length > 0 && (
        <div className="space-y-4">
          {visibleIssues.map((issue) => (
            <IssueCard key={`${issue.repoFullName}-${issue.id}`} issue={issue} />
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
              <a
                key={repo}
                href={`https://github.com/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-[#1c1c20] hover:bg-[#242428] text-[#8e8e93] hover:text-[#ededef] transition-colors"
              >
                {repo}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}





