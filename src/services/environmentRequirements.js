export function extractEnvironmentRequirements(issue) {
  const text = [
    issue?.title,
    issue?.body,
    ...(issue?.labels || []).flatMap((label) => [label?.name, label?.description]),
    ...(issue?.repoTopics || []),
  ].filter(Boolean).join(" ");
  const tags = new Set();

  if (/\bdocker(?:\s+compose)?\b/i.test(text)) tags.add("Docker");
  for (const match of text.matchAll(/\bnode(?:\.js)?\s*(?:version\s*)?v?(\d{1,2})(?:\.\d{1,2})?(?:\.\d{1,2})?\b/gi)) tags.add(`Node ${match[1]}`);
  for (const match of text.matchAll(/\bpython\s*(?:version\s*)?v?(3\.\d{1,2})\b/gi)) tags.add(`Python ${match[1]}`);
  if (/\b(?:rust toolchain|rustup|rustc|cargo|rust-toolchain(?:\.toml)?)\b/i.test(text)) tags.add("Rust toolchain");
  for (const match of text.matchAll(/\bjava\s*(?:version\s*)?v?(\d{1,2})\b/gi)) tags.add(`Java ${match[1]}`);
  if (/\bpostgres(?:ql)?\b/i.test(text)) tags.add("PostgreSQL");

  return [...tags];
}

export function addEnvironmentRequirements(issue) {
  return { ...issue, environmentRequirements: extractEnvironmentRequirements(issue) };
}
