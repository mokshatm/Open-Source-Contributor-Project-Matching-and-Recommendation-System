const skill = (name) => ({ name, classification: "explicit", evidence: [] });

function issue({ id, number, repoFullName, title, updatedAt, programmingLanguages = [], frameworks = [], databases = [], technicalConcepts = [], domain, difficulty, task = "Unknown" }) {
  return {
    id,
    number,
    title,
    url: `https://github.com/${repoFullName}/issues/${number}`,
    repoFullName,
    repoName: repoFullName.split("/")[1],
    repoUrl: `https://github.com/${repoFullName}`,
    updatedAt,
    state: "open",
    isPullRequest: false,
    requirementExtraction: {
      schemaVersion: "1.1",
      status: "complete",
      issueId: id,
      url: `https://github.com/${repoFullName}/issues/${number}`,
      programmingLanguages: programmingLanguages.map(skill),
      frameworks: frameworks.map(skill),
      databases: databases.map(skill),
      technicalConcepts: technicalConcepts.map(skill),
      domain: { primary: domain, categories: domain === "Unknown" ? [] : [domain], evidence: [] },
      taskCategory: { value: task, evidence: [] },
      estimatedDifficulty: { value: difficulty, evidence: [] },
    },
  };
}

export const EVALUATION_SNAPSHOT_DATE = "2026-11-03";
export const EVALUATION_SOURCE_STATS = Object.freeze({ collectedIssueCount: 932, trackedRepositoryCount: 15 });

// These records are a fixed snapshot of issues returned by the app's GitHub issue collector on the date above.
export const evaluationIssues = [
  issue({ id: 6178222805, number: 7588, repoFullName: "expressjs/express", title: "Outdated res.send() syntax in lib/response.js documentation example", updatedAt: "2026-11-03T07:30:35Z", programmingLanguages: ["JavaScript"], frameworks: ["Express"], technicalConcepts: ["Documentation"], domain: "Documentation", difficulty: "Unknown" }),
  issue({ id: 6168102212, number: 59540, repoFullName: "rails/rails", title: "Nested `reconnect!` calls end in `SystemStackError` when the connection drops during `configure_connection`", updatedAt: "2026-11-03T06:59:17Z", programmingLanguages: ["Ruby", "SQL"], databases: ["PostgreSQL"], technicalConcepts: ["Testing", "Concurrency"], domain: "Databases", difficulty: "Intermediate" }),
  issue({ id: 3847704274, number: 77285, repoFullName: "golang/go", title: "net/http: reject HTTP requests with CR/LF in chunk extension quoted-string", updatedAt: "2026-11-03T06:26:48Z", programmingLanguages: ["Go"], technicalConcepts: ["Networking", "Backend services"], domain: "Networking", difficulty: "Intermediate" }),
  issue({ id: 2347714527, number: 67940, repoFullName: "golang/go", title: "x/net/http2: header modifications after WriteHeader(http.StatusEarlyHints) cause a map race", updatedAt: "2026-11-03T06:13:37Z", programmingLanguages: ["Go"], technicalConcepts: ["Concurrency", "Networking", "Caching"], domain: "Networking", difficulty: "Advanced", task: "Bug fix" }),
  issue({ id: 6086543961, number: 15287, repoFullName: "pytest-dev/pytest", title: "9.2.0: monkeypatch.setattr undo deletes a MagicMock's child attribute (regression from #14969)", updatedAt: "2026-11-02T04:45:26Z", programmingLanguages: ["Python"], technicalConcepts: ["Testing"], domain: "Unknown", difficulty: "Intermediate", task: "Bug fix" }),
  issue({ id: 6085783131, number: 15286, repoFullName: "pytest-dev/pytest", title: "monkeypatch.setattr on a class's __annotations__ deletes them on undo (Python 3.14)", updatedAt: "2026-11-02T02:32:38Z", programmingLanguages: ["Python"], technicalConcepts: ["Testing", "Caching"], domain: "Unknown", difficulty: "Unknown", task: "Bug fix" }),
  issue({ id: 6169501070, number: 20657, repoFullName: "tailwindlabs/tailwindcss", title: "`color-mix(var(--color-red-500))` crashes the build with `Cannot read properties of undefined (reading 'kind')`", updatedAt: "2026-11-02T19:30:09Z", programmingLanguages: ["JavaScript"], frameworks: ["Node.js"], technicalConcepts: ["Frontend UI"], domain: "Frontend", difficulty: "Unknown" }),
  issue({ id: 6157853560, number: 20654, repoFullName: "tailwindlabs/tailwindcss", title: "Default extractor turns the regex character class in `/\x5b-:T\x5d/g` into a phantom utility `\x5b-:T\x5d`, and the generated declaration `-: T;` breaks Lightning CSS", updatedAt: "2026-11-02T15:55:54Z", programmingLanguages: ["JavaScript", "TypeScript"], frameworks: ["Vue.js", "Node.js"], technicalConcepts: ["Frontend UI"], domain: "Frontend", difficulty: "Unknown" }),
  issue({ id: 5313612317, number: 98142, repoFullName: "vercel/next.js", title: "Config redirects fire on _next/data requests when middleware.ts is present, breaking client-side navigation", updatedAt: "2026-11-02T13:04:15Z", programmingLanguages: ["JavaScript", "TypeScript"], frameworks: ["React", "Next.js"], domain: "Frontend", difficulty: "Unknown" }),
  issue({ id: 6106547196, number: 100906, repoFullName: "vercel/next.js", title: "turbopackSharedRuntime: true emits an inline bootstrap script that violates strict script-src CSPs", updatedAt: "2026-11-02T01:15:02Z", programmingLanguages: ["JavaScript"], frameworks: ["Next.js"], technicalConcepts: ["Docker", "Frontend UI"], domain: "Frontend", difficulty: "Unknown" }),
  issue({ id: 522372591, number: 35561, repoFullName: "golang/go", title: "net: better docs for PreferGo in Resolver", updatedAt: "2026-11-03T06:42:39Z", technicalConcepts: ["Documentation"], domain: "Documentation", difficulty: "Beginner", task: "Documentation" }),
];

export const evaluationProfiles = [
  {
    id: "eval_frontend_intermediate",
    name: "Evaluation profile A · Frontend maintainer",
    skills: ["JavaScript", "TypeScript", "React", "Next.js"],
    selectedDomains: ["Frontend & UI Engineering", "Web Frameworks & APIs"],
    experienceLevel: "Intermediate",
  },
  {
    id: "eval_go_advanced",
    name: "Evaluation profile B · Go networking contributor",
    skills: ["Go", "Networking", "Concurrency"],
    selectedDomains: ["Distributed Systems", "Developer Tooling"],
    experienceLevel: "Advanced",
  },
  {
    id: "eval_python_beginner",
    name: "Evaluation profile C · Python test contributor",
    skills: ["Python", "pytest", "Testing"],
    selectedDomains: ["Developer Tooling", "Web Frameworks & APIs"],
    experienceLevel: "Beginner",
  },
];

// Manually judged from issue-level requirements and profile skills/interests, independently of scores.
// Relevant = at least two exact requirement matches, or one exact match plus aligned issue domain (gain 2).
// Partial = an exact/related skill overlap or aligned domain/task, but not Relevant, with meaningful gaps (gain 1).
// Not relevant = neither requirement overlap nor aligned domain/task (gain 0); experience alone is not relevance.
const entries = [
  ["eval_frontend_intermediate", 6178222805, "Partially relevant", "JavaScript is an exact requirement match and Express is related through JavaScript, not explicitly declared. Documentation is unfamiliar and its domain does not align with the selected frontend interests."],
  ["eval_frontend_intermediate", 6168102212, "Not relevant", "Ruby and database requirements do not match the frontend profile or interests."],
  ["eval_frontend_intermediate", 3847704274, "Not relevant", "Go and networking requirements do not match the frontend profile or interests."],
  ["eval_frontend_intermediate", 2347714527, "Not relevant", "Go, concurrency, and networking requirements do not match the frontend profile or interests."],
  ["eval_frontend_intermediate", 6086543961, "Not relevant", "Python testing requirements do not match the frontend profile or interests."],
  ["eval_frontend_intermediate", 6085783131, "Not relevant", "Python testing and caching requirements do not match the frontend profile or interests."],
  ["eval_frontend_intermediate", 6169501070, "Relevant", "JavaScript and frontend UI requirements align with the profile's declared skills and selected frontend domain."],
  ["eval_frontend_intermediate", 6157853560, "Relevant", "JavaScript and TypeScript requirements and frontend domain align with declared skills and interests."],
  ["eval_frontend_intermediate", 5313612317, "Relevant", "JavaScript, TypeScript, React, and Next.js requirements directly match the profile and frontend interests."],
  ["eval_frontend_intermediate", 6106547196, "Relevant", "JavaScript and Next.js requirements match declared skills and the issue's frontend domain aligns with interests."],
  ["eval_frontend_intermediate", 522372591, "Not relevant", "Documentation is outside the profile's frontend interests and no declared skill is an extracted requirement."],

  ["eval_go_advanced", 6178222805, "Not relevant", "JavaScript and Express documentation requirements do not match Go networking interests."],
  ["eval_go_advanced", 6168102212, "Not relevant", "Ruby and database requirements do not match the Go networking profile."],
  ["eval_go_advanced", 3847704274, "Relevant", "Go and networking are explicit requirements and directly align with the profile's skills and distributed-systems interest."],
  ["eval_go_advanced", 2347714527, "Relevant", "Go, concurrency, and networking requirements directly match declared skills and interests."],
  ["eval_go_advanced", 6086543961, "Not relevant", "Python testing requirements do not match the Go profile."],
  ["eval_go_advanced", 6085783131, "Not relevant", "Python testing and caching requirements do not match the Go profile."],
  ["eval_go_advanced", 6169501070, "Not relevant", "JavaScript and frontend UI requirements do not match the Go networking profile."],
  ["eval_go_advanced", 6157853560, "Not relevant", "JavaScript, TypeScript, Vue, and frontend UI requirements do not match the Go profile."],
  ["eval_go_advanced", 5313612317, "Not relevant", "JavaScript and frontend framework requirements do not match the Go profile."],
  ["eval_go_advanced", 6106547196, "Not relevant", "JavaScript, Next.js, and frontend requirements do not match the Go profile."],
  ["eval_go_advanced", 522372591, "Partially relevant", "The issue is documentation for Go's PreferGo resolver; domain/task context is useful, though Go is not an extracted issue-level requirement."],

  ["eval_python_beginner", 6178222805, "Partially relevant", "The documentation task aligns with Developer Tooling interests, but JavaScript and Express are not profile skills."],
  ["eval_python_beginner", 6168102212, "Not relevant", "Ruby and database requirements do not match the Python testing profile or interests."],
  ["eval_python_beginner", 3847704274, "Not relevant", "Go networking requirements do not match the Python testing profile."],
  ["eval_python_beginner", 2347714527, "Not relevant", "Go concurrency and networking requirements do not match the Python testing profile."],
  ["eval_python_beginner", 6086543961, "Relevant", "Python and testing are explicit requirements and both are declared profile skills."],
  ["eval_python_beginner", 6085783131, "Relevant", "Python and testing are explicit requirements and both are declared profile skills."],
  ["eval_python_beginner", 6169501070, "Not relevant", "JavaScript and frontend UI requirements do not match the Python testing profile."],
  ["eval_python_beginner", 6157853560, "Not relevant", "JavaScript, TypeScript, Vue, and frontend UI requirements do not match the Python profile."],
  ["eval_python_beginner", 5313612317, "Not relevant", "JavaScript and React/Next.js requirements do not match the Python testing profile."],
  ["eval_python_beginner", 6106547196, "Not relevant", "JavaScript, Next.js, and frontend requirements do not match the Python testing profile."],
  ["eval_python_beginner", 522372591, "Partially relevant", "The documentation task aligns with Developer Tooling interests and is labelled beginner, but no Python skill is an extracted requirement."],
];

export const relevanceJudgments = entries.map(([profileId, issueId, label, rationale]) => ({ profileId, issueId, label, rationale }));
