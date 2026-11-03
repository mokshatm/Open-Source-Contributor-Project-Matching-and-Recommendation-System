const finiteNumber = (value) => typeof value === "number" && Number.isFinite(value);

function experienceScore(issue) {
  const component = issue?.match?.components?.experienceSuitability;
  return finiteNumber(component) ? component : null;
}

function skillScore(issue) {
  const component = issue?.match?.components?.skillCompatibility;
  return finiteNumber(component) ? component : null;
}

function timestamp(issue) {
  if (!issue?.updatedAt) return null;
  const value = Date.parse(issue.updatedAt);
  return Number.isFinite(value) ? value : null;
}

function compareKnownFirstDescending(left, right) {
  if (left === null && right !== null) return 1;
  if (left !== null && right === null) return -1;
  if (left === null && right === null) return 0;
  return right - left;
}

function compareStableIdentity(left, right) {
  const leftRepo = String(left.issue.repoFullName || "").toLowerCase();
  const rightRepo = String(right.issue.repoFullName || "").toLowerCase();
  if (leftRepo !== rightRepo) return leftRepo.localeCompare(rightRepo);
  const leftId = String(left.issue.id ?? left.issue.number ?? "");
  const rightId = String(right.issue.id ?? right.issue.number ?? "");
  return leftId.localeCompare(rightId, undefined, { numeric: true });
}

/** Rank eligible Stage 5 matches; score and explanation data are left unchanged. */
export function rankRecommendations(issues = []) {
  const eligible = (Array.isArray(issues) ? issues : [])
    .filter((issue) => issue?.eligibility?.eligible === true)
    .map((issue, index) => ({ issue, index }));

  eligible.sort((left, right) => {
    const scoreOrder = compareKnownFirstDescending(
      finiteNumber(left.issue.match?.score) ? left.issue.match.score : null,
      finiteNumber(right.issue.match?.score) ? right.issue.match.score : null,
    );
    if (scoreOrder) return scoreOrder;

    const skillOrder = compareKnownFirstDescending(skillScore(left.issue), skillScore(right.issue));
    if (skillOrder) return skillOrder;

    const experienceOrder = compareKnownFirstDescending(experienceScore(left.issue), experienceScore(right.issue));
    if (experienceOrder) return experienceOrder;

    const activityOrder = compareKnownFirstDescending(timestamp(left.issue), timestamp(right.issue));
    if (activityOrder) return activityOrder;

    return compareStableIdentity(left, right) || left.index - right.index;
  });

  return eligible.map(({ issue }, index) => ({ ...issue, rankingPosition: index + 1 }));
}
