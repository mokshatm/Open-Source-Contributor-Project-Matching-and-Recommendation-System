import { evaluateIssuesEligibility } from "@/services/eligibility";
import { matchIssuesToDeveloper } from "@/services/matching";
import { rankRecommendations } from "@/services/ranking";
import { EVALUATION_SNAPSHOT_DATE, EVALUATION_SOURCE_STATS, evaluationIssues, evaluationProfiles, relevanceJudgments } from "@/data/evaluationDataset";
import { meanMetric, ndcgAtK, precisionAtK, recallAtK } from "@/services/evaluationMetrics";

const K = 5;

export function evaluateFixedDataset() {
  const profiles = evaluationProfiles.map((profile) => {
    const judgments = relevanceJudgments.filter((judgment) => judgment.profileId === profile.id);
    const eligible = evaluateIssuesEligibility(evaluationIssues, profile);
    const matched = matchIssuesToDeveloper(eligible, profile);
    const ranked = rankRecommendations(matched);
    const judgedIds = new Set(judgments.map((judgment) => judgment.issueId));
    const judgedRanked = ranked.filter((issue) => judgedIds.has(issue.id));
    return {
      profile,
      candidateCount: evaluationIssues.length,
      judgmentCount: judgments.length,
      metrics: {
        precisionAt5: precisionAtK(judgedRanked, judgments, K),
        recallAt5: recallAtK(judgedRanked, judgments, K),
        ndcgAt5: ndcgAtK(judgedRanked, judgments, K),
      },
      topFive: judgedRanked.slice(0, K).map((issue) => ({
        ...issue,
        judgment: judgments.find((judgment) => judgment.issueId === issue.id) || null,
      })),
    };
  });

  const overall = Object.fromEntries(["precisionAt5", "recallAt5", "ndcgAt5"].map((metric) => [
    metric,
    meanMetric(profiles.map((result) => result.metrics[metric])),
  ]));
  const judgmentCount = relevanceJudgments.length;
  const expectedJudgments = evaluationProfiles.length * evaluationIssues.length;
  const availableIssueIds = new Set(evaluationIssues.map((issue) => issue.id));
  const missingJudgmentIssues = relevanceJudgments.filter((judgment) => !availableIssueIds.has(judgment.issueId));

  return {
    snapshotDate: EVALUATION_SNAPSHOT_DATE,
    sourceStats: EVALUATION_SOURCE_STATS,
    candidateCount: evaluationIssues.length,
    profileCount: evaluationProfiles.length,
    judgmentCount,
    judgmentCoverage: expectedJudgments ? judgmentCount / expectedJudgments : 0,
    missingJudgmentIssueCount: missingJudgmentIssues.length,
    overall,
    profiles,
  };
}
