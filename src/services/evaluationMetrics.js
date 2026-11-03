const GRADES = Object.freeze({ "Not relevant": 0, "Partially relevant": 1, Relevant: 2 });

function judgmentGrade(judgment) {
  if (typeof judgment === "number" && Number.isFinite(judgment)) return Math.max(0, judgment);
  return GRADES[judgment?.label ?? judgment] ?? null;
}

function issueId(item) {
  return typeof item === "object" && item !== null ? item.id : item;
}

function judgmentMap(judgments) {
  return new Map((Array.isArray(judgments) ? judgments : []).map((judgment) => [judgment.issueId, judgmentGrade(judgment)]));
}

export function precisionAtK(recommendations = [], judgments = [], k = 5) {
  if (!Number.isInteger(k) || k <= 0) return 0;
  const grades = judgmentMap(judgments);
  const topK = (Array.isArray(recommendations) ? recommendations : []).slice(0, k);
  const relevant = topK.filter((item) => (grades.get(issueId(item)) ?? 0) > 0).length;
  return relevant / k;
}

export function recallAtK(recommendations = [], judgments = [], k = 5) {
  if (!Number.isInteger(k) || k <= 0) return 0;
  const grades = judgmentMap(judgments);
  const totalRelevant = [...grades.values()].filter((grade) => grade !== null && grade > 0).length;
  if (!totalRelevant) return null;
  const topK = (Array.isArray(recommendations) ? recommendations : []).slice(0, k);
  const retrievedRelevant = topK.filter((item) => (grades.get(issueId(item)) ?? 0) > 0).length;
  return retrievedRelevant / totalRelevant;
}

export function ndcgAtK(recommendations = [], judgments = [], k = 5) {
  if (!Number.isInteger(k) || k <= 0) return 0;
  const grades = judgmentMap(judgments);
  const dcg = (values) => values.slice(0, k).reduce((sum, grade, index) => sum + ((2 ** grade) - 1) / Math.log2(index + 2), 0);
  const rankedGrades = (Array.isArray(recommendations) ? recommendations : [])
    .slice(0, k)
    .map((item) => grades.get(issueId(item)) ?? 0);
  const idealGrades = [...grades.values()].filter((grade) => grade !== null).sort((a, b) => b - a);
  const ideal = dcg(idealGrades);
  return ideal ? dcg(rankedGrades) / ideal : null;
}

export function meanMetric(values) {
  const knownValues = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return knownValues.length ? knownValues.reduce((sum, value) => sum + value, 0) / knownValues.length : null;
}
