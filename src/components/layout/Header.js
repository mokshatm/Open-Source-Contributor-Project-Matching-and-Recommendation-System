"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Search, Sun, Moon, UserRound, X } from "lucide-react";
import { applyDeveloperPersona, DEVELOPER_PERSONAS, getActivePersonaId, setActivePersona } from "@/services/developerPersonas";

function subscribeTheme(callback) {
  window.addEventListener("osmatcher-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("osmatcher-theme-change", callback); window.removeEventListener("storage", callback); };
}
function getTheme() { return localStorage.getItem("osMatcherTheme") || "dark"; }
function getServerTheme() { return "dark"; }
function subscribePersona(callback) {
  window.addEventListener("osmatcher-persona-change", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("osmatcher-persona-change", callback); window.removeEventListener("storage", callback); };
}
function getServerPersona() { return "my-profile"; }

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partialWarning, setPartialWarning] = useState(false);
  const [active, setActive] = useState(-1);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const personaId = useSyncExternalStore(subscribePersona, getActivePersonaId, getServerPersona);
  const timer = useRef(null);
  const searchSequence = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = getTheme();
    try {
      const saved = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null");
      window.setTimeout(() => setProfile(saved), 0);
    } catch { window.setTimeout(() => setProfile(null), 0); }
    const refreshProfile = () => {
      try { setProfile(JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null")); }
      catch { setProfile(null); }
    };
    window.addEventListener("osmatcher-profile-change", refreshProfile);
    return () => window.removeEventListener("osmatcher-profile-change", refreshProfile);
  }, []);

  useEffect(() => {
    window.clearTimeout(timer.current);
    const sequence = ++searchSequence.current;
    const clean = query.trim();
    if (clean.length < 2) return;
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const effectiveProfile = profile ? applyDeveloperPersona(profile, personaId) : null;
        const savedProfile = effectiveProfile ? { skills: effectiveProfile.skills || [], experienceLevel: effectiveProfile.experienceLevel, selectedDomains: effectiveProfile.selectedDomains || [] } : null;
        const response = await fetch("/api/github/search", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ q: clean, profile: savedProfile }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Search failed.");
        if (sequence !== searchSequence.current) return;
        setPartialWarning(Boolean(data.partial));
        setResults(data.results || []); setActive(-1);
      } catch (err) { if (sequence === searchSequence.current) { setError(err.message || "Search failed."); setResults([]); setPartialWarning(false); } }
      finally { if (sequence === searchSequence.current) setLoading(false); }
    }, 300);
    return () => window.clearTimeout(timer.current);
  }, [query, profile, personaId]);

  function changeTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("osMatcherTheme", next);
    window.dispatchEvent(new Event("osmatcher-theme-change"));
  }
  function openResult(item) {
    setQuery(""); setResults(null);
    if (item.type === "repository") router.push(`/explore?repo=${encodeURIComponent(item.repoFullName)}`);
    else router.push(`/explore?repo=${encodeURIComponent(item.repoFullName)}&q=${encodeURIComponent(item.title || "")}`);
  }
  function onKeyDown(event) {
    const count = results?.length || 0;
    if (event.key === "Escape") { setQuery(""); setResults(null); setError(""); setLoading(false); setPartialWarning(false); return; }
    if (event.key === "ArrowDown" && count) { event.preventDefault(); setActive((value) => (value + 1) % count); }
    if (event.key === "ArrowUp" && count) { event.preventDefault(); setActive((value) => (value <= 0 ? count - 1 : value - 1)); }
    if (event.key === "Enter" && active >= 0 && results?.[active]) { event.preventDefault(); openResult(results[active]); }
  }
  function disconnect() {
    if (!window.confirm("Disconnect this saved GitHub profile?")) return;
    localStorage.removeItem("developerEligibilityProfile"); setProfile(null); setMenuOpen(false);
    window.dispatchEvent(new Event("osmatcher-profile-change"));
  }
  const github = profile?.gitHubData?.profile;
  return (
    <header className="app-header h-16 border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="relative flex-1 max-w-lg">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input aria-label="Search issues, repositories, skills, and labels" role="combobox" aria-expanded={Boolean(query.trim().length >= 2)} aria-controls="global-search-results" value={query} onChange={(e) => { const value = e.target.value; setQuery(value); if (value.trim().length < 2) { setResults(null); setLoading(false); setError(""); } else { setLoading(true); setError(""); setResults(null); } }} onKeyDown={onKeyDown} onFocus={() => { if (query.trim().length >= 2) setResults((value) => value || []); }} placeholder="Search issues, repositories, skills..." className="app-input w-full pl-10 pr-10 py-2 rounded-xl text-sm" />
        {query && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Clear search" onClick={() => setQuery("")}><X className="w-3.5 h-3.5" /></button>}
        {query.trim().length >= 2 && <div id="global-search-results" role="listbox" className="search-popover absolute top-full mt-2 w-full rounded-xl overflow-hidden z-50 shadow-xl">
          {loading ? <p className="p-4 text-xs text-muted" role="status">Searching collected issues…</p> : error ? <p className="p-4 text-xs text-red-400" role="alert">{error}</p> : results?.length ? results.map((item, index) => <button key={`${item.type}-${item.id || item.repoFullName}`} role="option" aria-selected={active === index} onMouseEnter={() => setActive(index)} onClick={() => openResult(item)} className={`search-option w-full text-left p-3 border-b ${active === index ? "search-option-active" : ""}`}>
            <span className="block text-sm font-semibold text-primary">{item.title || item.repoFullName}</span>
            <span className="block mt-1 text-xs text-muted">{item.type === "repository" ? "Repository · " : "Issue · "}{item.repoFullName}{item.matchScore !== null && item.matchScore !== undefined ? ` · ${item.matchScore}/100 match` : ""}</span>
            {item.skills?.length > 0 && <span className="block mt-1 text-[11px] text-secondary">Skills: {item.skills.join(", ")}</span>}
            {item.labels?.length > 0 && <span className="block mt-1 text-xs text-secondary"><span className="font-semibold">Labels:</span> {item.labels.join(", ")}</span>}
            {item.environmentRequirements?.length > 0 && <span className="block mt-1 text-[10px] text-amber-300">Environment: {item.environmentRequirements.join(", ")}</span>}
          </button>) : <p className="p-4 text-xs text-muted">No matching issues or repositories. Try a skill, label, or repository name.</p>}
          {partialWarning && <p className="px-3 py-2 text-[10px] text-amber-500 border-t border-glass">Some repositories could not be searched; results may be incomplete.</p>}
        </div>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 ml-3">
        <button aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={changeTheme} className="control-button p-2 rounded-xl">{theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
        <div className="relative">
          <button aria-label="Open account menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="control-button flex items-center gap-2 p-1.5 rounded-xl">
            {github?.avatarUrl ? <img src={github.avatarUrl} alt="" className="w-7 h-7 rounded-full" /> : <UserRound className="w-4 h-4 mx-1" />}
            <span className="hidden sm:block text-sm max-w-28 truncate">{github?.username || "Account"}</span>
          </button>
          {menuOpen && <div className="account-popover absolute right-0 top-full mt-2 w-56 rounded-xl p-2 z-50 shadow-xl">
          {github ? <><div className="px-3 py-2 border-b border-glass mb-1"><p className="text-xs font-semibold text-primary">{github.name || github.username}</p><p className="text-[11px] text-muted">@{github.username}</p></div><label className="block px-3 py-2 text-[11px] text-muted">Recommendation persona<select aria-label="Select recommendation persona" value={personaId} onChange={(event) => setActivePersona(event.target.value)} className="app-input block w-full mt-1 rounded-lg px-2 py-1.5 text-xs">{DEVELOPER_PERSONAS.map((persona) => <option key={persona.id} value={persona.id}>{persona.label}</option>)}</select></label><p className="px-3 pb-2 text-[11px] text-muted">Demo personas change recommendation inputs only; your saved GitHub profile stays unchanged.</p><a className="menu-link" href="/profile">My Developer Profile</a><a className="menu-link" href={github.profileUrl} target="_blank" rel="noreferrer">View GitHub Profile</a><button className="menu-link w-full text-left" onClick={disconnect}>Disconnect GitHub</button></> : <><p className="px-3 py-2 text-xs text-muted">No GitHub profile saved.</p><label className="block px-3 py-2 text-[11px] text-muted">Recommendation persona<select aria-label="Select recommendation persona" value={personaId} onChange={(event) => setActivePersona(event.target.value)} className="app-input block w-full mt-1 rounded-lg px-2 py-1.5 text-xs">{DEVELOPER_PERSONAS.map((persona) => <option key={persona.id} value={persona.id}>{persona.label}</option>)}</select></label><a className="menu-link" href="/profile">Connect GitHub / Set Up Profile</a></>}
          </div>}
        </div>
      </div>
    </header>
  );
}
