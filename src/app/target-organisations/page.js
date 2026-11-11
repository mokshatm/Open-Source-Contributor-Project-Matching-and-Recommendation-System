"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Building2, Plus, Search, X } from "lucide-react";
import { QUICK_ISSUE_FILTERS, readRecommendationScope, saveRecommendationScope } from "@/services/recommendationScope";

function normalizeOrganization(input) {
  const value = input.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return null;
      const parts = url.pathname.split("/").filter(Boolean);
      const login = parts[0]?.toLowerCase() === "orgs" ? parts[1] : parts.length === 1 ? parts[0] : null;
      return login && /^[a-zA-Z0-9-]{1,39}$/.test(login) ? login.toLowerCase() : null;
    } catch { return null; }
  }
  return /^[a-zA-Z0-9-]{1,39}$/.test(value) ? value.toLowerCase() : null;
}

export default function TargetOrganisationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [mode, setMode] = useState("general");
  const [quickFilters, setQuickFilters] = useState([]);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounce = useRef(null);
  const searchSequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = readRecommendationScope();
        setOrganizations(saved.targetOrganizations);
        setMode(saved.mode);
        setQuickFilters(saved.quickFilters);
      } catch { setOrganizations([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.clearTimeout(debounce.current);
    const sequence = ++searchSequence.current;
    const term = query.trim();
    if (term.length < 2) return;
    debounce.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/github/organizations?q=${encodeURIComponent(term)}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Organization search failed.");
        if (sequence !== searchSequence.current) return;
        setMatches(result.organizations || []);
      } catch (err) { if (sequence === searchSequence.current) { setError(err.message || "Organization search failed."); setMatches([]); } }
      finally { if (sequence === searchSequence.current) setLoading(false); }
    }, 300);
    return () => window.clearTimeout(debounce.current);
  }, [query]);

  function savePreferences(nextOrganizations, nextMode, nextFilters = quickFilters) {
    const unique = [...new Set(nextOrganizations)];
    setOrganizations(unique); setMode(nextMode); setQuickFilters(nextFilters);
    saveRecommendationScope(nextMode, unique, nextFilters);
  }

  function addOrganization(raw) {
    const normalized = normalizeOrganization(raw);
    if (!normalized) { setError("Enter a GitHub organization username or organization URL."); return; }
    setError("");
    savePreferences([...organizations, normalized], mode);
    setQuery(""); setMatches([]);
  }

  function setRecommendationMode(nextMode) {
    if (nextMode === "targeted" && !organizations.length) {
      setError("Add at least one GitHub organization before switching to Targeted Mode.");
      return;
    }
    setError("");
    savePreferences(organizations, nextMode);
  }

  function toggleQuickFilter(filter) {
    const next = quickFilters.includes(filter) ? quickFilters.filter((item) => item !== filter) : [...quickFilters, filter];
    savePreferences(organizations, mode, next);
  }

  return <div className="max-w-5xl mx-auto space-y-7">
    <header className="pb-6 border-b border-glass">
      <div className="flex items-center gap-3"><Building2 className="w-7 h-7 text-[#ea6c33]" /><h1 className="text-3xl font-bold tracking-tight text-[#ededef]">Target Organisations</h1></div>
    </header>

    <section className="glass-panel rounded-2xl p-6 space-y-5">
      <div><h2 className="text-xl font-bold text-[#ededef]">Organizations to follow</h2><p className="text-base text-muted mt-1">Enter a username or GitHub organization URL, or search public organizations.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); addOrganization(query); }} className="relative flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" /><input value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setError(""); if (value.trim().length < 2) { setMatches([]); setLoading(false); } else { setMatches([]); setLoading(true); } }} placeholder="Search or add an organization (e.g. sympy)" className="app-input w-full pl-11 pr-4 py-3 rounded-xl text-base" aria-label="Search or add a GitHub organization" /></div>
        <button type="submit" className="rounded-xl bg-[#ea6c33] px-5 py-3 text-base font-bold text-white"><Plus className="inline w-5 h-5 mr-1" />Add</button>
      </form>
      {query.trim().length >= 2 && <div className="search-popover rounded-xl divide-y divide-white/10 overflow-hidden">{loading ? <p className="p-4 text-sm text-muted">Searching GitHub organizations…</p> : matches.length ? matches.map((organization) => <button type="button" key={organization.login} onClick={() => addOrganization(organization.login)} className="menu-link w-full flex items-center gap-3 text-left text-base"><img src={organization.avatarUrl} alt="" className="w-8 h-8 rounded-full" /><span>{organization.login}</span><Plus className="ml-auto w-4 h-4" /></button>) : !error && <p className="p-4 text-sm text-muted">No organization matches. You can add a valid username directly.</p>}</div>}
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
      <ul className="flex flex-wrap gap-2">{organizations.map((organization) => <li key={organization} className="glass-pill rounded-full px-4 py-2 text-sm inline-flex items-center gap-2">{organization}<button type="button" aria-label={`Remove ${organization}`} onClick={() => { const next = organizations.filter((item) => item !== organization); savePreferences(next, next.length ? mode : "general"); }} className="text-muted hover:text-primary"><X className="w-4 h-4" /></button></li>)}</ul>
      {!organizations.length && <p className="text-sm text-muted">No organizations added yet.</p>}
    </section>

    <section className="glass-panel rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-[#ededef]">Quick issue filters</h2>
      <div className="flex flex-wrap gap-2.5">{QUICK_ISSUE_FILTERS.map((filter) => <button key={filter} type="button" aria-pressed={quickFilters.includes(filter)} onClick={() => toggleQuickFilter(filter)} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${quickFilters.includes(filter) ? "border-[#ea6c33] bg-[#ea6c33]/15 text-[#f47b45]" : "border-glass text-secondary hover:text-primary"}`}>{filter}</button>)}</div>
    </section>

    <section className="glass-panel rounded-2xl p-6 space-y-5">
      <h2 className="text-xl font-bold text-[#ededef]">Recommendation mode</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <button type="button" aria-pressed={mode === "general"} onClick={() => setRecommendationMode("general")} className={`rounded-xl border p-5 text-left transition-colors ${mode === "general" ? "border-[#ea6c33] bg-[#ea6c33]/10" : "border-glass hover:bg-white/[0.03]"}`}><span className="block text-lg font-bold text-primary">General Mode</span></button>
        <button type="button" aria-pressed={mode === "targeted"} onClick={() => setRecommendationMode("targeted")} className={`rounded-xl border p-5 text-left transition-colors ${mode === "targeted" ? "border-[#ea6c33] bg-[#ea6c33]/10" : "border-glass hover:bg-white/[0.03]"}`}><span className="block text-lg font-bold text-primary">Targeted Mode</span></button>
      </div>
      <p className="text-sm text-muted">Current mode: <strong className="text-primary">{mode === "targeted" ? "Targeted" : "General"}</strong>{mode === "targeted" ? ` · ${organizations.length} organization${organizations.length === 1 ? "" : "s"}` : ""}</p>
    </section>

    <Link href="/recommendations" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ea6c33] px-6 py-4 text-lg font-bold text-white shadow-lg shadow-[#ea6c33]/15 transition-colors hover:bg-[#d45f28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400">View recommendations in this mode <ArrowRight className="w-5 h-5" /></Link>
  </div>;
}
