import { test, expect } from "vitest";
import { createDefaultPostprocessor } from "../src/index.js";
import { jaccardSimilarity } from "@rag-sdk/utils";

test("maxPromptChars 字符预算裁剪", async () => {
  const postprocessor = createDefaultPostprocessor({
    budget: { maxPromptChars: 15 },
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "short" },
    { id: "c2", content: "this is a very long content" },
    { id: "c3", content: "tiny" },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  // c1(5) + c3(4) = 9 <= 15, c2(27) would exceed
  expect(result.chunks.length).toBeLessThanOrEqual(3);
  expect(result.appliedBudget?.maxPromptChars).toBe(15);
});

test("nearDuplicate 自定义 similarityFn", async () => {
  const postprocessor = createDefaultPostprocessor({
    nearDuplicate: { similarityThreshold: 0.5, similarityFn: (a, b) => jaccardSimilarity(a, b, 2) },
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "hello world foo bar", metadata: { score: 0.9 } },
    { id: "c2", content: "hello world foo baz", metadata: { score: 0.7 } },
    { id: "c3", content: "completely different", metadata: { score: 0.5 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  // c1 和 c2 的 jaccard 相似度应较高，其中一个会被去重
  expect(result.chunks.map((c) => c.id)).toContain("c1");
  expect(result.droppedCandidates?.some((d) => d.candidate.id === "c2")).toBe(true);
});

test("sourceCoverage 自定义 sourceField", async () => {
  const postprocessor = createDefaultPostprocessor({
    sourceCoverage: { maxPerSource: 1, sourceField: "origin" },
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "A1", metadata: { origin: "src-a" } },
    { id: "c2", content: "A2", metadata: { origin: "src-a" } },
    { id: "c3", content: "B1", metadata: { origin: "src-b" } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  const originACount = result.chunks.filter(
    (c) => c.metadata?.origin === "src-a"
  ).length;
  expect(originACount).toBe(1);
});

test("sourceCoverage __unknown__ fallback", async () => {
  const postprocessor = createDefaultPostprocessor({
    sourceCoverage: { maxPerSource: 1 },
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "A1", metadata: { source: "src-a" } },
    { id: "c2", content: "A2" }, // 无 source 字段
    { id: "c3", content: "A3" }, // 无 source 字段
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  // 两个无 source 的 chunk 会被归入 __unknown__，受 maxPerSource=1 限制
  const unknownCount = result.chunks.filter(
    (c) => !c.metadata?.source
  ).length;
  expect(unknownCount).toBe(1);
});

test("retrievalOrderComparator 保持原始顺序", async () => {
  const postprocessor = createDefaultPostprocessor({
    orderBy: "retrieval",
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "第三", metadata: { score: 0.3 } },
    { id: "c2", content: "第一", metadata: { score: 0.9 } },
    { id: "c3", content: "第二", metadata: { score: 0.6 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.selectedCandidates![0].id).toBe("c1");
  expect(result.selectedCandidates![1].id).toBe("c2");
  expect(result.selectedCandidates![2].id).toBe("c3");
});

test("自定义 CandidateComparator 传入 orderBy", async () => {
  const postprocessor = createDefaultPostprocessor({
    orderBy: (a, b) => a.content.localeCompare(b.content),
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "zebra", metadata: { score: 0.9 } },
    { id: "c2", content: "apple", metadata: { score: 0.6 } },
    { id: "c3", content: "mango", metadata: { score: 0.3 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.selectedCandidates![0].id).toBe("c2"); // apple
  expect(result.selectedCandidates![1].id).toBe("c3"); // mango
  expect(result.selectedCandidates![2].id).toBe("c1"); // zebra
});
