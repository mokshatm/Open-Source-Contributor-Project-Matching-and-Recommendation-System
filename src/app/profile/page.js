"use client";

import React, { useState } from "react";

import {
  GitBranch,
  Star,
  Users,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
  RotateCw,
  Search,
  Sparkles,
  Info,
  Layers,
  Award
} from "lucide-react";

function GitHubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

const PRESET_DOMAINS = [
  "Web Frameworks & APIs",
  "Developer Tooling",
  "Distributed Systems",
  "Database Internals",
  "Machine Learning & NLP",
  "Cloud & DevOps",
  "Security & Cryptography",
  "Frontend & UI Engineering"
];

const EXPERIENCE_LEVELS = [
  { id: "Beginner", label: "Beginner", desc: "0-1 years / learning" },
  { id: "Intermediate", label: "Intermediate", desc: "1-3 years / regular contributor" },
  { id: "Advanced", label: "Advanced", desc: "3+ years / library author" }
];

export default function ProfilePage() {
  // GitHub Input & Connection State
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gitHubData, setGitHubData] = useState(null);

  // Profile Customization State
  const [skills, setSkills] = useState([]);
  const [newSkillText, setNewSkillText] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [selectedDomains, setSelectedDomains] = useState([
    "Web Frameworks & APIs",
    "Developer Tooling"
  ]);


  // Handle GitHub API fetch
  const handleConnectGitHub = async (e) => {
    if (e) e.preventDefault();
    const query = usernameInput.trim();
    if (!query) {
      setError("Please enter a GitHub username.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github/profile?username=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch GitHub profile.");
      setGitHubData(data);
      if (data.warnings?.length) setError(data.warnings.join(" "));

      // Derive inferred skills from detected languages
      const newInferredSkills = data.detectedLanguages.map((lang) => ({
        name: lang.name,
        source: "repository",
        repoCount: lang.repoCount,
        sampleRepos: lang.sampleRepos,
        evidence: `Detected in public repository language statistics. Observed in ${lang.repoCount} public ${
          lang.repoCount === 1 ? "repository" : "repositories"
        } (${lang.sampleRepos.join(", ")}).`
      }));

      // Combine: keep existing manual skills, replace inferred with new live ones
      setSkills((prev) => {
        const existingManual = prev.filter((s) => s.source === "manual");
        const existingInferredNames = new Set(newInferredSkills.map((s) => s.name.toLowerCase()));
        const uniqueManual = existingManual.filter(
          (s) => !existingInferredNames.has(s.name.toLowerCase())
        );
        return [...newInferredSkills, ...uniqueManual];
      });
    } catch (err) {
      setError(err.message || "Failed to fetch GitHub profile.");
    } finally {
      setLoading(false);
    }
  };

  // Add a manually declared skill
  const handleAddManualSkill = (e) => {
    if (e) e.preventDefault();
    const clean = newSkillText.trim();
    if (!clean) return;

    // Check duplicate
    if (skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      setNewSkillText("");
      return;
    }

    const newSkill = {
      name: clean,
      source: "manual",
      evidence: "Declared by the developer."
    };

    setSkills((prev) => [...prev, newSkill]);
    setNewSkillText("");
  };

  // Remove a skill
  const handleRemoveSkill = (skillName) => {
    setSkills((prev) => prev.filter((s) => s.name !== skillName));
  };

  // Toggle domain selection
  const handleToggleDomain = (domain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Stage 1 Identification */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#ededef]">
              Developer Profiling
            </h1>
            <p className="text-xs text-[#71717a] mt-1">
              Constructing a developer profile by combining observed public GitHub activity with declared proficiencies.
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-sky-950/40 text-sky-400 border border-sky-800/40 shadow-sm">
            Stage 1
          </span>
        </div>

        {/* 2. Connect GitHub Form */}
        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a] block">
              CONNECT GITHUB
            </span>
            <label
              htmlFor="github-username"
              className="text-sm font-semibold text-[#ededef] block mt-1"
            >
              Enter your GitHub username
            </label>
          </div>

          <form onSubmit={handleConnectGitHub} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a]">
                <GitHubIcon className="w-4 h-4" />
              </span>
              <input
                id="github-username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="github-username (e.g. torvalds, tiangolo, octocat)"
                className="w-full glass-input text-xs text-[#ededef] pl-10 pr-4 py-2.5 rounded-xl placeholder-[#52525b] focus:outline-none focus:border-white/[0.2] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              {loading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Connect</span>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-red-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Connected Profile Summary Banner */}
          {gitHubData && (
            <div className="p-4 rounded-xl bg-black/25 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                {gitHubData.profile.avatarUrl ? (
                  <img
                    src={gitHubData.profile.avatarUrl}
                    alt={gitHubData.profile.username}
                    className="w-12 h-12 rounded-full border border-white/[0.1] object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/[0.08] flex items-center justify-center text-sm font-bold text-[#ededef]">
                    {gitHubData.profile.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#ededef]">
                      {gitHubData.profile.name}
                    </h3>
                    <span className="text-xs text-[#71717a] font-mono">
                      @{gitHubData.profile.username}
                    </span>
                  </div>
                  <p className="text-xs text-[#8e8e93] line-clamp-1 mt-0.5">
                    {gitHubData.profile.bio}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-[#8e8e93] shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.06]">
                <div className="text-center sm:text-right">
                  <span className="block font-bold text-[#ededef]">
                    {gitHubData.profile.publicReposCount}
                  </span>
                  <span className="text-[10px] text-[#71717a]">Public Repos</span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="block font-bold text-[#ededef]">
                    {gitHubData.profile.followersCount}
                  </span>
                  <span className="text-[10px] text-[#71717a]">Followers</span>
                </div>
                <a
                  href={gitHubData.profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[#71717a] hover:text-[#ededef] hover:bg-white/[0.05]"
                  title="View GitHub profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 3. Middle Row: Detected Languages & Experience Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/[0.06]">
          {/* Detected Languages */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#ededef]">
              Detected languages
            </h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              {gitHubData?.detectedLanguages?.length > 0
                ? gitHubData.detectedLanguages.map((l) => l.name).join(" â€¢ ")
                : gitHubData ? "No languages detected in the fetched repositories." : "Connect a GitHub profile to detect languages."}
            </p>
            <p className="text-[11px] text-[#71717a] leading-tight">
              Observed in public repository language statistics. (Research note: Not presented as verified developer proficiency).
            </p>
          </div>

          {/* Experience Level Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#ededef]">
                Experience level
              </h3>
              <span className="text-xs text-[#71717a] font-mono">User-selected</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = experienceLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setExperienceLevel(lvl.id)}
                    className={`p-2.5 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#ea6c33] text-white shadow-md"
                        : "bg-[#1c1c20] text-[#8e8e93] hover:bg-[#242428] hover:text-[#d4d4d8]"
                    }`}
                  >
                    <span className="block text-xs font-bold">{lvl.label}</span>
                    <span className={`block text-[9px] leading-tight mt-0.5 font-mono ${
                      isSelected ? "text-white/70" : "text-[#71717a]"
                    }`}>
                      {lvl.desc.split("/")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Domain & Technical Interests Selector */}
        <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#ededef]">
              Technical Interests & Domains
            </h3>
            <span className="text-xs text-[#71717a]">
              Select domains to calibrate project recommendations
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_DOMAINS.map((domain) => {
              const isSelected = selectedDomains.includes(domain);
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => handleToggleDomain(domain)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#ea6c33] text-white"
                      : "bg-[#1c1c20] text-[#8e8e93] hover:bg-[#242428] hover:text-[#ededef]"
                  }`}
                >
                  {domain}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Skill Evidence Section */}
        <div className="space-y-4 pt-4 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#ededef]">
                Skill evidence
              </h2>
              <p className="text-xs text-[#71717a]">
                Transparently distinguishing observed public repository activity from user-declared skills.
              </p>
            </div>

            {/* Inline Add Skill Form */}
            <form onSubmit={handleAddManualSkill} className="flex items-center gap-2">
              <input
                type="text"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                placeholder="Add skill (e.g. Docker, PyTorch)"
                className="glass-input text-xs text-[#ededef] px-3 py-1.5 rounded-lg placeholder-[#52525b] focus:outline-none w-48"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-[#1c1c20] hover:bg-[#2a2a2e] text-[#ededef] text-xs font-bold cursor-pointer transition-colors"
                title="Add declared skill"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Skill Items List */}
          <div className="space-y-3">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="p-4 rounded-xl bg-black/20 border border-white/[0.05] flex items-start justify-between gap-4 hover:border-white/[0.09] transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#ededef]">
                      {skill.name}
                    </span>
                    {skill.source === "repository" && (
                      <span className="text-[11px] font-mono text-[#71717a]">
                        â€¢ {skill.repoCount} {skill.repoCount === 1 ? "repository" : "repositories"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8e8e93] leading-relaxed">
                    {skill.evidence}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {skill.source === "repository" ? (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-emerald-700 text-white">
                      Repository evidence
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-sky-700 text-white">
                      Manually added
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.name)}
                    className="p-1 rounded text-[#71717a] hover:text-red-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title={`Remove ${skill.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {skills.length === 0 && (
              <div className="p-6 rounded-xl border border-dashed border-white/[0.08] text-center text-xs text-[#71717a]">
                No skills registered yet. Connect your GitHub username above or manually add skills.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


