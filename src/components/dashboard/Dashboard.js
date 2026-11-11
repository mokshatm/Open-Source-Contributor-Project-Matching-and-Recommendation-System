"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Compass, GitBranch, RefreshCw } from "lucide-react";
import { readRecommendationScope } from "@/services/recommendationScope";
import SaveIssueButton from "@/components/contributions/SaveIssueButton";
import { applyDeveloperPersona, getActivePersonaId } from "@/services/developerPersonas";
import EnvironmentTags from "@/components/common/EnvironmentTags";
import { listContributions } from "@/services/contributionApiClient";

const GROUPS = ["programmingLanguages", "frameworks", "databases", "technicalConcepts"];

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contributions, setContributions] = useState([]);
  const [contributionsLoading, setContributionsLoading] = useState(false);
  const [contributionsError, setContributionsError] = useState("");

  const load = useCallback(async () => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null"); } catch { /* Ignore invalid local profile data. */ }
    setProfile(saved);
    if (!saved?.username || !saved?.gitHubData?.profile) { setResult(null); setError(""); return; }
    setLoading(true); setError("");
    try {
      const scope = readRecommendationScope();
      const effectiveProfile = applyDeveloperPersona(saved);
      const response = await fetch("/api/github/eligibility", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({
          username: saved.username, skills: effectiveProfile.skills || [],
          experienceLevel: effectiveProfile.experienceLevel,
          selectedDomains: effectiveProfile.selectedDomains || [], personaId: getActivePersonaId(), ...scope,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load recommendations.");
      setResult(data);
    } catch (err) { setError(err.message || "Unable to load GitHub data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    window.addEventListener("osmatcher-profile-change", load);
    window.addEventListener("osmatcher-target-mode-change", load);
    window.addEventListener("osmatcher-persona-change", load);
    window.addEventListener("storage", load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("osmatcher-profile-change", load);
      window.removeEventListener("osmatcher-target-mode-change", load);
      window.removeEventListener("osmatcher-persona-change", load);
      window.removeEventListener("storage", load);
    };
  }, [load]);

  const username = profile?.username;
  const loadContributions = useCallback(async () => {
    if (!username) { setContributions([]); setContributionsError(""); return; }
    setContributionsLoading(true);
    setContributionsError("");
    try { setContributions(await listContributions()); }
    catch (err) { setContributionsError(err.message || "Unable to load Supabase contribution metrics."); }
    finally { setContributionsLoading(false); }
  }, [username]);

  useEffect(() => {
    const timer = window.setTimeout(loadContributions, 0);
    window.addEventListener("osmatcher-contribution-saved", loadContributions);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("osmatcher-contribution-saved", loadContributions);
    };
  }, [loadContributions]);

  const github = profile?.gitHubData?.profile;
  const skills = profile?.skills || [];
  const detected = [...new Map([
    ...skills.filter((item) => item.source === "repository"),
    ...(profile?.gitHubData?.detectedTopics || []).map((name) => ({ name, source: "repository topic" })),
  ].map((item) => [item.name.toLowerCase(), item])).values()];
  const declared = skills.filter((item) => item.source === "manual");
  const complete = Boolean(profile?.username && github && profile?.experienceLevel && Array.isArray(profile?.selectedDomains));
  const recommendations = result?.recommendations || [];
  const activeSkillFilters = useMemo(() => {
    if (!profile) return [];
    const activeProfile = applyDeveloperPersona(profile);
    return [...new Set((activeProfile.skills || []).map((skill) => typeof skill === "string" ? skill : skill?.name).filter(Boolean))];
  }, [profile]);

  const savedIssuesCount = contributions.filter((item) => normalizeStatus(item.status) === "saved").length;
  const uniqueTargetRepositories = new Set(contributions.map((item) => String(item.repo_name || "").trim().toLowerCase()).filter(Boolean)).size;
  const currentlyContributingCount = contributions.filter((item) => ["in progress", "currently contributing", "active"].includes(normalizeStatus(item.status))).length;
  const prsTrackedCount = contributions.filter((item) => {
    const status = normalizeStatus(item.status);
    const prUrl = item.pr_url || item.pull_request_url || item.prUrl || "";
    return Boolean(String(prUrl).trim()) || ["pr submitted", "pr open", "pr merged", "open", "merged"].includes(status);
  }).length;
  const metricValue = (value) => contributionsError ? "—" : contributionsLoading ? "…" : value;

  if (!github) return <div className="max-w-5xl mx-auto space-y-7">
    <header className="pb-6 border-b border-glass">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#ea6c33]">CONTRIBUTOR WORKSPACE</span>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#ededef] mt-2">Find an issue worth contributing to.</h1>
      <p className="text-base text-secondary mt-3">Connect your GitHub username to see real opportunities matched to your profile.</p>
    </header>
    <section className="glass-panel rounded-2xl p-7 flex flex-col sm:flex-row sm:items-center gap-5">
      <GitBranch className="w-7 h-7 text-[#ea6c33]" />
      <div className="flex-1"><h2 className="text-lg font-semibold text-primary">Connect your GitHub username</h2><p className="text-sm text-secondary mt-1">Recommendations use your public repositories and declared profile.</p></div>
      <Link href="/profile" className="rounded-xl bg-[#ea6c33] px-5 py-3 text-sm font-semibold text-white">Set up profile <ArrowRight className="inline w-4 h-4" /></Link>
    </section>
    <Link href="/target-organisations" className="glass-panel rounded-2xl p-6 block"><span className="text-lg font-semibold text-primary">Target organisations</span><span className="block text-sm text-secondary mt-2">Choose organisations and switch between targeted and general recommendation modes.</span></Link>
  </div>;

  return <div className="max-w-6xl mx-auto space-y-8">
    <header className="flex flex-col sm:flex-row sm:items-center gap-5 pb-7 border-b border-glass">
      {github.avatarUrl && <img src={github.avatarUrl} alt={`${github.username} GitHub avatar`} className="w-16 h-16 rounded-full border border-glass object-cover" />}
      <div className="flex-1"><h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ededef]">Welcome back</h1><p className="text-base sm:text-lg font-medium text-secondary mt-1">@{github.username}</p></div>
    </header>
    {error && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 text-sm text-amber-300">{error} <button onClick={load} className="underline">Retry</button></div>}
    {result?.errors?.length > 0 && <p role="status" className="text-sm text-amber-300">Some tracked repositories could not be loaded, so the recommendation list may be incomplete.</p>}
    {result?.rateLimitHit && <p role="status" className="text-sm text-amber-300">GitHub rate limits interrupted collection. Try again after the limit resets.</p>}
    {!complete && <p className="text-sm text-amber-300">Your developer profile is incomplete. <Link href="/profile" className="underline">Complete profile</Link></p>}

    <section aria-label="Contribution metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        { label: "Saved Issues", value: metricValue(savedIssuesCount) },
        { label: "Target Repositories", value: metricValue(uniqueTargetRepositories) },
        { label: "Currently Contributing", value: metricValue(currentlyContributingCount) },
        { label: "PRs Tracked", value: metricValue(prsTrackedCount) },
      ].map((item) => <div key={item.label} className="glass-card rounded-2xl p-5 sm:p-6 min-h-32 flex flex-col justify-center">
        <p className="text-3xl font-bold text-[#ededef]">{item.value}</p>
        <h2 className="text-base font-semibold text-primary mt-2">{item.label}</h2>
      </div>)}
      {!contributionsLoading && contributionsError && <p role="alert" className="sm:col-span-2 xl:col-span-4 text-sm text-amber-300">Couldn’t load contribution metrics from Supabase: {contributionsError}</p>}
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-[#ededef]">Top recommendations</h2><p className="text-sm text-muted mt-1">Ranked for {result?.profile?.personaLabel || "your developer profile"}{result?.profile?.isDemoPersona ? " · demonstration inputs" : ""}.</p></div><button aria-label="Refresh recommendations" onClick={load} disabled={loading} className="control-button p-2.5 rounded-lg"><RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} /></button></div>
      {loading && !result ? <p role="status" className="p-5 text-sm text-muted">Loading recommendations from GitHub…</p> : recommendations.length ? recommendations.slice(0, 5).map((issue) => {
        const required = GROUPS.flatMap((group) => issue.requirementExtraction?.[group] || []).map((skill) => skill.name);
        return <article key={issue.id} className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-muted">{issue.repoFullName}</p><h3 className="text-base sm:text-lg font-semibold text-[#ededef] mt-1 leading-snug">{issue.title}</h3></div><span className="text-sm font-semibold text-[#ea6c33]">{issue.match?.score == null ? "Score unavailable" : `${issue.match.score}/100 match`}</span></div>
          {issue.labels?.length > 0 && <p className="text-sm text-secondary mt-3"><span className="text-base font-semibold">Labels:</span> {issue.labels.map((label) => label.name).join(", ")}</p>}
          {required.length > 0 && <p className="text-sm text-secondary mt-1"><span className="text-base font-semibold">Required skills:</span> {required.join(", ")}</p>}
          <EnvironmentTags requirements={issue.environmentRequirements} />
          <div className="flex items-center gap-3 mt-4"><a href={issue.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#ea6c33]">Open issue <ArrowRight className="w-4 h-4" /></a><SaveIssueButton issue={issue} /></div>
        </article>;
      }) : result && <p className="glass-panel rounded-2xl p-6 text-sm text-muted">No eligible issues were found in the tracked repositories.</p>}
      <Link href="/recommendations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ea6c33]">View all recommendations <ArrowRight className="w-4 h-4" /></Link>
    </section>

    <section className="grid md:grid-cols-3 gap-5">
      <div className="glass-panel rounded-2xl p-5 space-y-4"><h2 className="text-xl font-bold text-[#ededef]">Skill overview</h2>
        <div><p className="text-sm font-semibold uppercase tracking-wide text-muted">Detected from repositories</p><p className="text-sm text-secondary mt-1 leading-relaxed">{detected.map((item) => item.name).join(", ") || "No repository language evidence available."}</p></div>
        <div><p className="text-sm font-semibold uppercase tracking-wide text-muted">Declared by you</p><p className="text-sm text-secondary mt-1 leading-relaxed">{declared.map((item) => item.name).join(", ") || "No declared skills yet."}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-muted">Declared interests and domains</p><p className="text-sm text-secondary mt-1 leading-relaxed">{profile.selectedDomains?.join(", ") || "None selected."}</p></div>
        <Link href="/profile" className="text-sm text-[#ea6c33]">Edit profile <ArrowRight className="inline w-4 h-4" /></Link>
      </div>
      <div className="glass-panel rounded-2xl p-5 space-y-3"><h2 className="text-xl font-bold text-[#ededef]">Contribution opportunities</h2>
        <Link className="menu-link text-base font-semibold" href="/explore?difficulty=Beginner">Beginner friendly issues <ArrowRight className="inline w-4 h-4" /></Link>
        <Link className="menu-link text-base font-semibold" href="/recommendations">Issues matching your interests <ArrowRight className="inline w-4 h-4" /></Link>
        <Link className="menu-link text-base font-semibold" href="/recommendations?learning=1">Learning opportunities with unfamiliar skills <ArrowRight className="inline w-4 h-4" /></Link>
        <Link className="menu-link text-base font-semibold" href="/explore">Explore all issues <Compass className="inline w-4 h-4" /></Link>
      </div>
      <Link href="/target-organisations" className="glass-panel rounded-2xl p-5 flex flex-col justify-between min-h-40"><div><h2 className="text-xl font-bold text-[#ededef]">Target organisations</h2><p className="text-sm text-secondary mt-2 leading-relaxed">Focus recommendations on organizations you want to prepare for.</p></div><span className="text-sm font-semibold text-[#ea6c33] mt-4">Manage targets <ArrowRight className="inline w-4 h-4" /></span></Link>
    </section>
    {!result && !loading && <button onClick={load} className="text-sm text-[#ea6c33]">Load recommendations</button>}
  </div>;
}
