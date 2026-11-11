"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { readRecommendationScope } from "@/services/recommendationScope";
import SaveIssueButton from "@/components/contributions/SaveIssueButton";
import EnvironmentTags from "@/components/common/EnvironmentTags";
import { applyDeveloperPersona, getActivePersonaId } from "@/services/developerPersonas";

export default function RecommendationsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [learningOnly, setLearningOnly] = useState(false);
  const [personaLabel, setPersonaLabel] = useState("");

  const load = useCallback(async () => {
    let profile;
    try { profile = JSON.parse(localStorage.getItem("developerEligibilityProfile") || "null"); } catch { profile = null; }
    if (!profile?.username || !profile?.gitHubData) {
      setLoading(false);
      setError("Connect your GitHub username on your profile to load recommendations.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const scope = readRecommendationScope();
      const effectiveProfile = applyDeveloperPersona(profile);
      const response = await fetch("/api/github/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          username: profile.username,
          skills: effectiveProfile.skills || [],
          experienceLevel: effectiveProfile.experienceLevel,
          selectedDomains: effectiveProfile.selectedDomains || [],
          personaId: getActivePersonaId(),
          ...scope,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load recommendations.");
      setItems(data.recommendations || []);
      setPersonaLabel(data.profile?.personaLabel || "");
    } catch (err) {
      setError(err.message || "Unable to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLearningOnly(new URLSearchParams(window.location.search).get("learning") === "1");
      load();
    }, 0);
    window.addEventListener("osmatcher-persona-change", load);
    window.addEventListener("osmatcher-target-mode-change", load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("osmatcher-persona-change", load);
      window.removeEventListener("osmatcher-target-mode-change", load);
    };
  }, [load]);

  const rows = learningOnly ? items.filter((issue) => issue.match?.unfamiliarSkills?.length > 0) : items;

  return <div className="max-w-5xl mx-auto space-y-7">
    <header className="pb-6 border-b border-glass">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ededef]">
        {learningOnly ? "Learning opportunities" : "Recommendations"}
      </h1>
    </header>

    {loading && <p role="status" className="glass-panel rounded-2xl p-5 text-base text-muted">Loading ranked issues…</p>}
    {error && <div role="alert" className="glass-panel rounded-2xl p-5 text-sm text-secondary">{error} <Link href="/profile" className="text-base font-semibold text-[#ea6c33] underline">Set up profile</Link> <button onClick={load} className="ml-2 text-base font-semibold underline">Retry</button></div>}
    {!loading && !error && !rows.length && <p className="glass-panel rounded-2xl p-6 text-base text-muted">{learningOnly ? "No ranked issues currently include unfamiliar skills." : "No eligible recommendations were found."}</p>}

    <div className="space-y-4">
      {rows.map((issue) => <article key={issue.id} className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted">#{issue.rankingPosition} · {issue.repoFullName}</p>
            <h2 className="text-lg sm:text-xl font-bold text-[#ededef] mt-1 leading-snug">{issue.title}</h2>
          </div>
          <span className="text-base font-semibold text-[#ea6c33]">{issue.match?.score == null ? "Score unavailable" : `${issue.match.score}/100`}</span>
        </div>
        {issue.match?.unfamiliarSkills?.length > 0 && <p className="text-base text-secondary mt-3"><span className="font-semibold">Learning skills:</span> {issue.match.unfamiliarSkills.join(", ")}</p>}
        <EnvironmentTags requirements={issue.environmentRequirements} />
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <a href={issue.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-base font-semibold text-[#ea6c33]">Open issue <ArrowRight className="w-4 h-4" /></a>
          <SaveIssueButton issue={issue} />
        </div>
      </article>)}
    </div>

    <div className="flex items-center gap-4">
      <Link href="/explore" className="inline-flex items-center gap-1.5 text-base font-semibold text-[#ea6c33]">Explore all issues <ArrowRight className="w-4 h-4" /></Link>
      <button onClick={load} disabled={loading} aria-label="Refresh recommendations" className="control-button p-2.5 rounded-lg"><RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} /></button>
    </div>
  </div>;
}
