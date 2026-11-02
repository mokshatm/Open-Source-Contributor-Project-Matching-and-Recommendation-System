import "server-only";
import { createHash } from "node:crypto";

export const REQUIREMENT_TAXONOMY = {
  programmingLanguages: [
    { name: "Python", pattern: /\bpython\b/gi },
    { name: "JavaScript", pattern: /\b(?:javascript|js)\b/gi },
    { name: "TypeScript", pattern: /\b(?:typescript|ts)\b/gi },
    { name: "Java", pattern: /\bjava\b/gi },
    { name: "C++", pattern: /(?<![\w])c\+\+(?!\w)|\bcpp\b/gi },
    { name: "Go", pattern: /\b(?:golang|go language|go modules?|go packages?|go code|go implementation|go tests?|(?:code|implementation|tests?) in go|written in go|implemented in go)\b|\b(?:implement|write|add|fix|update|build|create|test|port)\w*\b.{0,48}\bin go\b/gi },
    { name: "Rust", pattern: /\brust\b/gi },
    { name: "Ruby", pattern: /\bruby\b/gi },
    { name: "PHP", pattern: /\bphp\b/gi },
    { name: "C#", pattern: /\bc#\b|\bc-sharp\b/gi },
    { name: "Kotlin", pattern: /\bkotlin\b/gi },
    { name: "Swift", pattern: /\bswift\b/gi },
    { name: "Scala", pattern: /\bscala\b/gi },
    { name: "SQL", pattern: /\bsql\b/gi },
  ],
  frameworks: [
    { name: "React", pattern: /\breact(?:\.js|js)?\b/gi },
    { name: "Next.js", pattern: /\bnext(?:\.js|js)\b/gi },
    { name: "Django", pattern: /\bdjango\b/gi },
    { name: "FastAPI", pattern: /\bfast\s?api\b/gi },
    { name: "Express", pattern: /\bexpress(?:\.js)?\b/gi },
    { name: "Flask", pattern: /\bflask\b/gi },
    { name: "Spring Boot", pattern: /\bspring\s?boot\b/gi },
    { name: "Vue.js", pattern: /\bvue(?:\.js|js)?\b/gi },
    { name: "Angular", pattern: /\bangular\b/gi },
    { name: "Svelte", pattern: /\bsvelte\b/gi },
    { name: "Node.js", pattern: /\bnode(?:\.js|js)\b/gi },
    { name: "NestJS", pattern: /\bnestjs\b/gi },
    { name: "Laravel", pattern: /\blaravel\b/gi },
    { name: "TensorFlow", pattern: /\btensorflow\b/gi },
    { name: "PyTorch", pattern: /\bpytorch\b/gi },
  ],
  databases: [
    { name: "PostgreSQL", pattern: /\b(?:postgresql|postgres)\b/gi },
    { name: "MySQL", pattern: /\bmysql\b/gi },
    { name: "MongoDB", pattern: /\b(?:mongodb|mongo\s?db)\b/gi },
    { name: "Redis", pattern: /\bredis\b/gi },
    { name: "SQLite", pattern: /\bsqlite\b/gi },
    { name: "Cassandra", pattern: /\bcassandra\b/gi },
    { name: "Elasticsearch", pattern: /\belasticsearch\b/gi },
  ],
  technicalConcepts: [
    { name: "Docker", pattern: /\bdocker\b/gi },
    { name: "Kubernetes", pattern: /\bkubernetes\b|\bk8s\b/gi },
    { name: "REST APIs", pattern: /\brest(?:ful)?(?:\s+api|\s+endpoint|\s+service|\s+interface)s?\b/gi },
    { name: "GraphQL", pattern: /\bgraphql\b/gi },
    { name: "Git", pattern: /\bgit\b/gi },
    { name: "CI/CD", pattern: /\bci\s*\/\s*cd\b|\bcontinuous integration\b|\bcontinuous delivery\b/gi },
    { name: "Authentication", pattern: /\bauthentication\b|\bauth(?:ent|orization)\b|\boauth\b|\blogin flow\b/gi },
    { name: "Testing", pattern: /\btests?\b|\btest suite\b|\btest coverage\b|\bunit testing\b|\bintegration testing\b/gi },
    { name: "Concurrency", pattern: /\bconcurren(?:cy|t)\b|\bparallel(?:ism|ize|ization)?\b|\brace condition\b|\bthread(?:ing|s)?\b/gi },
    { name: "Networking", pattern: /\bnetwork(?:ing)?\b|\btcp\/?ip\b|\bhttp(?:s)?\b|\bwebsocket\b|\bdns\b|\bproxy\b/gi },
    { name: "Machine learning", pattern: /\bmachine learning\b|\bdeep learning\b|\bneural network\b|\binference\b/gi },
    { name: "Security", pattern: /\bsecurity\b|\bvulnerabilit(?:y|ies)\b|\bexploit\b|\bsql injection\b|\bxss\b|\bcsrf\b|\bencryption\b/gi },
    { name: "Frontend UI", pattern: /\bfrontend\b|\bfront-end\b|\buser interface\b|\bui component\b|\baccessibility\b|\bcss\b|\bhtml\b/gi },
    { name: "Backend services", pattern: /\bbackend\b|\bback-end\b|\bserver[- ]side\b|\bapi server\b/gi },
    { name: "DevOps and deployment", pattern: /\bdevops\b|\bdeployment\b|\bdeploy(?:ment)? pipeline\b|\bbuild pipeline\b|\brelease process\b/gi },
    { name: "Performance", pattern: /\bperformance\b|\boptimi[sz](?:e|ation|ing)\b|\blatency\b|\bthroughput\b|\bmemory usage\b/gi },
    { name: "Caching", pattern: /\bcach(?:e|ing|ed)\b/gi },
    { name: "Documentation", pattern: /\bdocumentation\b|\bdocs?\b|\breadme\b|\bapi reference\b/gi },
    { name: "Refactoring", pattern: /\brefactor(?:ing)?\b|\bcode cleanup\b/gi },
    { name: "Accessibility", pattern: /\baccessibility\b|\baria\b|\bscreen reader\b|\bkeyboard navigation\b/gi },
    { name: "Serialization", pattern: /\bseriali[sz](?:e|ation|ing)\b|\bjson schema\b|\bprotobuf\b/gi },
    { name: "Logging and observability", pattern: /\blogging\b|\bobservability\b|\bmetrics\b|\btracing\b/gi },
    { name: "Containers", pattern: /\bcontaineri[sz](?:e|ation)\b|\bcontainer image\b/gi },
    { name: "Distributed systems", pattern: /\bdistributed systems?\b|\bconsensus\b|\breplication\b/gi },
  ],
};

const TASK_RULES = [
  { value: "Documentation", pattern: /\b(?:update|add|improve|fix|write|clarify|correct|expand|create|document)\w*\s+(?:the\s+)?(?:docs?|documentation|readme|guides?)\b|\b(?:docs?|documentation|readme|guide)\b.{0,45}\b(?:outdated|missing|incorrect|wrong|incomplete|needs? update)\b|^\s*docs?(?:\([^)]*\))?\s*:/gi },
  { value: "Bug fix", pattern: /\b(?:fix|resolve|correct|repair|address)\b.{0,80}\b(?:bug|issue|error|crash|regression|incorrect|broken|wrong result)\b|\b(?:bug|regression|crash|broken behavior|incorrect result|wrong result)\b|\berror handling\b/gi },
  { value: "Testing", pattern: /\b(?:add|write|create|improve|update|expand)\b.{0,50}\b(?:unit |integration |regression |automated )?tests?\b|\btests?\b.{0,50}\b(?:missing|needed|failing|coverage|add|write)\b/gi },
  { value: "Optimisation", pattern: /\b(?:optimise|optimize|improve|speed up|reduce)\b.{0,50}\b(?:performance|memory|latency|throughput|startup|overhead)\b|\bperformance improvement\b/gi },
  { value: "Refactoring", pattern: /\brefactor(?:ing)?\b|\bcode cleanup\b|\bclean up (?:the )?code\b/gi },
  { value: "Feature implementation", pattern: /\bimplement\b|\badd support\b|\badd (?:a |an |the )?(?:new )?feature\b|\badd(?:ing)?\s+(?:[\w.-]+\s+){0,3}(?:support|types?|methods?|commands?|options?|fields?|flags?|parameters?|endpoints?|apis?|functions?|features?|integrations?)\b|\bintroduc(?:e|ing)\b|\ballow users? to\b|\bsupport for\b/gi },
];

const DIFFICULTY_RULES = {
  Beginner: /\bgood first issue\b|\bbeginner\b|\bfirst[- ]timers? only\b|\beasy\b|\bstarter issue\b/gi,
  Intermediate: /\bintermediate\b|\bmedium[- ]difficulty\b/gi,
  Advanced: /\badvanced\b|\bhard\b|\bcomplex\b|\bexpert\b/gi,
};

const DOMAIN_RULES = [
  { value: "Security", pattern: /\bsecurity\b|\bvulnerabilit(?:y|ies)\b|\bauthentication\b|\bauthorization\b|\boauth\b|\bsql injection\b|\bxss\b|\bcsrf\b/gi },
  { value: "Machine learning", pattern: /\bmachine learning\b|\bdeep learning\b|\bneural network\b|\bpytorch\b|\btensorflow\b|\bmodel inference\b/gi },
  { value: "DevOps", pattern: /\bdevops\b|\bdocker\b|\bkubernetes\b|\bk8s\b|\bci\s*\/\s*cd\b|\bdeployment pipeline\b/gi },
  { value: "Databases", pattern: /\bdatabase\b|\bpostgresql\b|\bpostgres\b|\bmysql\b|\bmongodb\b|\bredis\b|\bsqlite\b|\bquery(?:s|ies)?\b|\bschema migration\b/gi },
  { value: "Networking", pattern: /\bnetwork(?:ing)?\b|\btcp\/?ip\b|\bhttp(?:s)?\b|\bwebsocket\b|\bdns\b|\bproxy\b|\bprotocol\b/gi },
  { value: "Frontend", pattern: /\bfrontend\b|\bfront-end\b|\buser interface\b|\bui component\b|\bbrowser\b|\bcss\b|\bhtml\b|\baccessibility\b/gi },
  { value: "Backend", pattern: /\bbackend\b|\bback-end\b|\bserver[- ]side\b|\brest(?:ful)? api\b|\bgraphql\b|\bapi server\b/gi },
  { value: "Documentation", pattern: /\bdocumentation\b|\bdocs?\b|\breadme\b|\bapi reference\b/gi },
];

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
}

export function preprocessIssueText(value = "") {
  return decodeEntities(String(value).normalize("NFKC"))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, " $1 ")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/```[^\n]*\n?/g, " ")
    .replace(/[`*_~]/g, " ")
    .replace(/(^|\n)\s{0,3}#{1,6}\s/g, "$1 ")
    .replace(/^\s*[-+|]{2,}\s*$/gm, " ")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSources(issue) {
  const sources = [
    { source: "issue title", text: preprocessIssueText(issue.title || "") },
    { source: "issue description", text: preprocessIssueText(issue.body || "").slice(0, 20000) },
    ...(issue.labels || []).map((label) => ({ source: "issue label", text: preprocessIssueText(label.name || "") })),
  ];
  return sources.filter(({ text }) => text.length > 0);
}

function buildRepositoryContext(issue) {
  return {
    programmingLanguage: issue.repoLanguage ? { name: issue.repoLanguage, source: "repository language", classification: "repository_context" } : null,
    name: issue.repoFullName ? { name: issue.repoFullName, source: "repository name", classification: "repository_context" } : null,
    topics: (issue.repoTopics || []).filter(Boolean).map((name) => ({ name, source: "repository topic", classification: "repository_context" })),
  };
}

function quoteEvidence(text, index, length) {
  const start = Math.max(0, index - 54);
  const end = Math.min(text.length, index + length + 74);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function matchesForRule(rule, sources) {
  const evidence = [];
  const seen = new Set();
  for (const source of sources) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(source.text)) !== null) {
      const text = quoteEvidence(source.text, match.index, match[0].length);
      const key = `${source.source}:${text.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        evidence.push({ source: source.source, text });
      }
      if (evidence.length >= 3) break;
      if (match[0].length === 0) rule.pattern.lastIndex += 1;
    }
    if (evidence.length >= 3) break;
  }
  return evidence;
}

function extractSkills(rules, sources) {
  return rules.flatMap((rule) => {
    const evidence = matchesForRule(rule, sources);
    if (!evidence.length) return [];
    const classification = evidence.some((item) => item.source === "issue title" || item.source === "issue description") ? "explicit" : "inferred";
    return [{ name: rule.name, evidence, classification }];
  });
}

function classifyDomain(sources) {
  const found = DOMAIN_RULES.flatMap((rule) => {
    const evidence = matchesForRule(rule, sources);
    return evidence.length ? [{ value: rule.value, evidence }] : [];
  });
  const hasFront = found.some((item) => item.value === "Frontend");
  const hasBack = found.some((item) => item.value === "Backend");
  if (hasFront && hasBack) {
    const evidence = found.filter((item) => item.value === "Frontend" || item.value === "Backend").flatMap((item) => item.evidence);
    return { primary: "Full-stack", categories: [...found.map((item) => item.value), "Full-stack"], evidence };
  }
  found.sort((a, b) => b.evidence.length - a.evidence.length || a.value.localeCompare(b.value));
  return {
    primary: found[0]?.value || "Unknown",
    categories: found.map((item) => item.value),
    evidence: found.flatMap((item) => item.evidence),
  };
}

function classifyTask(sources) {
  const intentSources = sources
    .filter((source) => source.source === "issue title" || source.source === "issue label" || source.source === "issue description")
    .map((source) => source.source === "issue description" ? { ...source, text: source.text.slice(0, 4000) } : source);
  const candidates = TASK_RULES.map((rule) => ({ value: rule.value, evidence: matchesForRule(rule, intentSources) }))
    .filter((item) => item.evidence.length)
    .sort((a, b) => b.evidence.length - a.evidence.length);
  const best = candidates[0];
  if (!best || (candidates[1] && candidates[1].evidence.length === best.evidence.length)) {
    return { value: "Unknown", evidence: [] };
  }
  return { value: best.value, evidence: best.evidence };
}

function classifyDifficulty(sources, skills, taskCategory) {
  const labelSources = sources.filter((source) => source.source === "issue label");
  for (const [value, pattern] of Object.entries(DIFFICULTY_RULES)) {
    const evidence = matchesForRule({ pattern }, labelSources);
    if (evidence.length) return { value, evidence };
  }

  const allText = sources.filter((source) => source.source !== "repository language" && source.source !== "repository topic" && source.source !== "repository name");
  const advancedPattern = /\b(?:architect(?:ure)?|rewrite|redesign|distributed|concurren(?:cy|t)|race condition|cryptograph(?:y|ic)|kernel|protocol|migration across|breaking change|large[- ]scale)\b/gi;
  const advancedEvidence = matchesForRule({ pattern: advancedPattern }, allText);
  if (advancedEvidence.length >= 2 && (skills.technicalConcepts.length >= 2 || skills.frameworks.length + skills.databases.length >= 2)) {
    return { value: "Advanced", evidence: advancedEvidence.slice(0, 4) };
  }

  const text = allText.map((source) => source.text).join(" ");
  const narrow = /\b(?:small|simple|minor|typo|one[- ]line|straightforward)\b/i.test(text);
  const beginnerTask = taskCategory.value === "Documentation" || taskCategory.value === "Testing";
  const beginnerLabelText = /\b(?:good first issue|beginner|easy|starter issue)\b/i.test(labelSources.map((source) => source.text).join(" "));
  if ((narrow && beginnerTask) || beginnerLabelText) {
    const evidence = matchesForRule({ pattern: /\b(?:small|simple|minor|typo|one[- ]line|straightforward|good first issue|beginner|easy|starter issue)\b/gi }, [...allText, ...labelSources]);
    return { value: "Beginner", evidence };
  }

  const scopePattern = /\b(?:add support|implement|fix|update|handle|integrat(?:e|ion)|extend)\b/gi;
  const scopeEvidence = matchesForRule({ pattern: scopePattern }, allText);
  const hasTechnicalSignal = skills.programmingLanguages.length + skills.frameworks.length + skills.databases.length + skills.technicalConcepts.length > 0;
  if (scopeEvidence.length && hasTechnicalSignal && (taskCategory.value !== "Unknown" || skills.technicalConcepts.length >= 2)) {
    return { value: "Intermediate", evidence: scopeEvidence.slice(0, 3) };
  }
  return { value: "Unknown", evidence: [] };
}

function issueSignature(issue) {
  return createHash("sha256").update(JSON.stringify({
    id: issue.id, title: issue.title, body: issue.body || "", labels: (issue.labels || []).map((label) => label.name),
    repoFullName: issue.repoFullName, repoLanguage: issue.repoLanguage, repoTopics: issue.repoTopics || [],
  })).digest("hex");
}

const extractionCache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 5000;

export function extractIssueRequirements(issue) {
  const cacheKey = `1.1:${issue.id}:${issueSignature(issue)}`;
  const cached = extractionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const sources = buildSources(issue);
  const skills = {
    programmingLanguages: extractSkills(REQUIREMENT_TAXONOMY.programmingLanguages, sources),
    frameworks: extractSkills(REQUIREMENT_TAXONOMY.frameworks, sources),
    databases: extractSkills(REQUIREMENT_TAXONOMY.databases, sources),
    technicalConcepts: extractSkills(REQUIREMENT_TAXONOMY.technicalConcepts, sources),
  };
  const domain = classifyDomain(sources);
  const taskCategory = classifyTask(sources);
  const estimatedDifficulty = classifyDifficulty(sources, skills, taskCategory);
  const result = {
    schemaVersion: "1.1",
    status: "complete",
    issueId: issue.id,
    url: issue.url,
    ...skills,
    repositoryContext: buildRepositoryContext(issue),
    domain,
    taskCategory,
    estimatedDifficulty,
  };
  if (extractionCache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = extractionCache.keys().next().value;
    if (firstKey) extractionCache.delete(firstKey);
  }
  extractionCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export function extractRequirementsForIssues(issues) {
  return issues.map((issue) => {
    try {
      return { ...issue, requirementExtraction: extractIssueRequirements(issue) };
    } catch {
      return {
        ...issue,
        requirementExtraction: {
          schemaVersion: "1.1", status: "unavailable", issueId: issue.id, url: issue.url,
          programmingLanguages: [], frameworks: [], databases: [], technicalConcepts: [],
          domain: { primary: "Unknown", categories: [], evidence: [] },
          taskCategory: { value: "Unknown", evidence: [] },
          estimatedDifficulty: { value: "Unknown", evidence: [] },
        },
      };
    }
  });
}
