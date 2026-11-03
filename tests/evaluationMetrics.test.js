import test from "node:test";
import assert from "node:assert/strict";
import { ndcgAtK, precisionAtK, recallAtK } from "../src/services/evaluationMetrics.js";

test("empty recommendations return zero at k when the relevance pool has positives", () => {
  const judgments = [{ issueId: 1, label: "Relevant" }, { issueId: 2, label: "Partially relevant" }];
  assert.equal(precisionAtK([], judgments, 5), 0);
  assert.equal(recallAtK([], judgments, 5), 0);
  assert.equal(ndcgAtK([], judgments, 5), 0);
});

test("empty judgment pools report undefined recall and NDCG", () => {
  assert.equal(precisionAtK([], [], 5), 0);
  assert.equal(recallAtK([], [], 5), null);
  assert.equal(ndcgAtK([], [], 5), null);
});

test("fewer than five recommendations use the documented fixed precision denominator", () => {
  const recommendations = [{ id: 1 }, { id: 2 }];
  const judgments = [
    { issueId: 1, label: "Relevant" },
    { issueId: 2, label: "Not relevant" },
    { issueId: 3, label: "Partially relevant" },
  ];
  assert.equal(precisionAtK(recommendations, judgments, 5), 0.2);
  assert.equal(recallAtK(recommendations, judgments, 5), 0.5);
  assert.ok(ndcgAtK(recommendations, judgments, 5) > 0 && ndcgAtK(recommendations, judgments, 5) <= 1);
});

test("NDCG uses graded relevance and discounts lower-ranked results", () => {
  const judgments = [
    { issueId: "high", label: "Relevant" },
    { issueId: "partial", label: "Partially relevant" },
    { issueId: "none", label: "Not relevant" },
  ];
  const ideal = ndcgAtK(["high", "partial", "none"], judgments, 3);
  const reversed = ndcgAtK(["partial", "high", "none"], judgments, 3);
  assert.equal(ideal, 1);
  const expectedReversed = (1 + 3 / Math.log2(3)) / (3 + 1 / Math.log2(3));
  assert.ok(Math.abs(reversed - expectedReversed) < 1e-12);
  assert.ok(reversed < ideal);
});
