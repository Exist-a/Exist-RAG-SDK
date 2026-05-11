import { test, expect } from "vitest";
import {
  createRuntime,
  createDefaultPostprocessor,
  DefaultRetrievalPostprocessor,
  RuntimeError,
} from "../src/index.js";
import type { RuntimeRetriever, RuntimeGenerator } from "../src/index.js";

function makeChunks(count: number, options?: { withScore?: boolean; source?: string }): Array<{
  id: string;
  content: string;
  metadata?: Record<string, string | number | boolean | null>;
}> {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    content: `内容 ${i + 1}`,
    metadata: {
      ...(options?.withScore ? { score: 1 - i * 0.1 } : {}),
      ...(options?.source ? { source: options.source } : {}),
    },
  }));
}

const mockRetriever: RuntimeRetriever = {
  async retrieve(query) {
    return {
      chunks: [
        { id: "c1", content: `结果1: ${query.query}` },
        { id: "c2", content: `结果2: ${query.query}` },
      ],
    };
  },
};

const mockGenerator: RuntimeGenerator = {
  async generate({ query, chunks }) {
    return {
      answer: `回答: ${query.query} (基于 ${chunks.length} 个片段)`,
    };
  },
};

// 1. score threshold 会把 candidate 放入 droppedCandidates
test("score threshold 过滤低分候选并记录 droppedCandidates", async () => {
  const postprocessor = createDefaultPostprocessor({
    scoreThreshold: 0.5,
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "高分", metadata: { score: 0.8 } },
    { id: "c2", content: "中分", metadata: { score: 0.5 } },
    { id: "c3", content: "低分", metadata: { score: 0.3 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.chunks).toHaveLength(2);
  expect(result.droppedCandidates).toHaveLength(1);
  expect(result.droppedCandidates![0].candidate.id).toBe("c3");
  expect(result.droppedCandidates![0].reason).toContain("低于阈值");
});

// 2. budget trim 会把 candidate 放入 droppedCandidates
test("budget trim 超出数量限制的候选进入 droppedCandidates", async () => {
  const postprocessor = createDefaultPostprocessor({
    budget: { maxCandidates: 2 },
    debug: true,
  });

  const chunks = makeChunks(4);

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.chunks).toHaveLength(2);
  expect(result.droppedCandidates).toHaveLength(2);
  expect(result.appliedBudget).toBeDefined();
  expect(result.appliedBudget!.beforeTrim).toBe(4);
  expect(result.appliedBudget!.afterTrim).toBe(2);
});

// 3. selectionTrace 记录 dropped reason
test("selectionTrace 记录 threshold 和 trim 的 dropped reason", async () => {
  const postprocessor = createDefaultPostprocessor({
    scoreThreshold: 0.2,
    budget: { maxCandidates: 2 },
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "A", metadata: { score: 0.9 } },
    { id: "c2", content: "B", metadata: { score: 0.5 } },
    { id: "c3", content: "C", metadata: { score: 0.3 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.selectionTrace).toBeDefined();
  const thresholdDrops = result.selectionTrace!.filter(
    (t) => t.action === "threshold"
  );
  // 0.2 阈值下没有 candidate 被过滤，threshold drops 应为 0
  expect(thresholdDrops.length).toBe(0);

  const trimDrops = result.selectionTrace!.filter(
    (t) => t.action === "trimmed"
  );
  expect(trimDrops.length).toBeGreaterThanOrEqual(1);
  expect(trimDrops[0].reason).toContain("超出数量限制");
});

// 4. selectedCandidates 顺序稳定
test("selectedCandidates 保持原始顺序（不配置 orderBy）", async () => {
  const postprocessor = createDefaultPostprocessor({
    budget: { maxCandidates: 3 },
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "第一" },
    { id: "c2", content: "第二" },
    { id: "c3", content: "第三" },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.selectedCandidates).toBeDefined();
  expect(result.selectedCandidates![0].id).toBe("c1");
  expect(result.selectedCandidates![1].id).toBe("c2");
  expect(result.selectedCandidates![2].id).toBe("c3");
});

// 5. debug=false 时不强制返回完整 post-retrieval trace
test("debug=false 时省略完整 trace 和 droppedCandidates", async () => {
  const postprocessor = createDefaultPostprocessor({
    scoreThreshold: 0.5,
    budget: { maxCandidates: 1 },
    debug: false,
  });

  const chunks = [
    { id: "c1", content: "A", metadata: { score: 0.9 } },
    { id: "c2", content: "B", metadata: { score: 0.3 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.droppedCandidates).toBeUndefined();
  expect(result.selectionTrace).toBeUndefined();
  expect(result.metadata).toBeDefined();
  expect(result.metadata!.droppedCount).toBe(1);
});

// 6. custom predicate 可以过滤 candidate
test("custom predicate 过滤不符合条件的候选", async () => {
  const postprocessor = createDefaultPostprocessor({
    customPredicate: (candidate) => candidate.id !== "c2",
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "保留" },
    { id: "c2", content: "过滤" },
    { id: "c3", content: "保留" },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.chunks).toHaveLength(2);
  expect(result.chunks.map((c) => c.id)).toEqual(["c1", "c3"]);
  expect(result.droppedCandidates!.some((d) => d.candidate.id === "c2")).toBe(
    true
  );
});

// 7. postprocessor 抛错时仍能被 runtime 阶段错误包装
test("postprocessor 抛错时被 RuntimeError 包装为 post-retrieval 阶段", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return { effectiveQuery: query };
      },
    },
    retriever: mockRetriever,
    postprocessor: {
      async postprocess() {
        throw new Error("后处理失败");
      },
    },
    generator: mockGenerator,
  });

  await expect(
    runtime.run({ query: { query: "test" } })
  ).rejects.toSatisfy((error: unknown) => {
    return (
      error instanceof RuntimeError &&
      error.stage === "post-retrieval" &&
      error.message.includes("后处理失败")
    );
  });
});

// 8. near-duplicate removal 会保留更合适的候选并记录 duplicate reason
test("near-duplicate removal 保留高分候选并记录原因", async () => {
  const postprocessor = createDefaultPostprocessor({
    nearDuplicate: true,
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "这是一段几乎完全相同的文本内容", metadata: { score: 0.9 } },
    { id: "c2", content: "这是一段几乎完全相同的文本内容", metadata: { score: 0.7 } },
    { id: "c3", content: "完全不同的内容", metadata: { score: 0.5 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.chunks.map((c) => c.id)).toContain("c1");
  expect(result.chunks.map((c) => c.id)).not.toContain("c2");
  expect(result.droppedCandidates!.some((d) => d.candidate.id === "c2")).toBe(
    true
  );
  const duplicateTrace = result.selectionTrace!.filter(
    (t) => t.action === "duplicate" && t.candidateId === "c2"
  );
  expect(duplicateTrace.length).toBeGreaterThanOrEqual(1);
});

// 9. source coverage 会限制单一 source 独占结果
test("source coverage 限制单一来源的候选数量", async () => {
  const postprocessor = createDefaultPostprocessor({
    sourceCoverage: { maxPerSource: 2 },
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "A1", metadata: { source: "source-a" } },
    { id: "c2", content: "A2", metadata: { source: "source-a" } },
    { id: "c3", content: "A3", metadata: { source: "source-a" } },
    { id: "c4", content: "B1", metadata: { source: "source-b" } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  const sourceACount = result.chunks.filter(
    (c) => c.metadata?.source === "source-a"
  ).length;
  expect(sourceACount).toBe(2);
  expect(result.droppedCandidates!.some((d) => d.candidate.id === "c3")).toBe(
    true
  );
});

// 10. context ordering 会记录最终上下文顺序
test("context ordering 按分数降序排序并记录 reordered trace", async () => {
  const postprocessor = createDefaultPostprocessor({
    orderBy: "score",
    debug: true,
  });

  const chunks = [
    { id: "c1", content: "低分", metadata: { score: 0.3 } },
    { id: "c2", content: "高分", metadata: { score: 0.9 } },
    { id: "c3", content: "中分", metadata: { score: 0.6 } },
  ];

  const result = await postprocessor.postprocess({ query: "test" }, chunks, {});

  expect(result.selectedCandidates![0].id).toBe("c2");
  expect(result.selectedCandidates![1].id).toBe("c3");
  expect(result.selectedCandidates![2].id).toBe("c1");

  const reorderTrace = result.selectionTrace!.filter(
    (t) => t.action === "reordered"
  );
  expect(reorderTrace.length).toBe(3);
  expect(reorderTrace.find((t) => t.candidateId === "c2")!.orderIndex).toBe(0);
});

// 附加：pipeline 层级验证 debug 信息传递
test("pipeline 将 postRetrievalDebug 传递到 RuntimeResult", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return { effectiveQuery: query };
      },
    },
    retriever: {
      async retrieve() {
        return {
          chunks: [
            { id: "c1", content: "高分", metadata: { score: 0.9 } },
            { id: "c2", content: "低分", metadata: { score: 0.2 } },
          ],
        };
      },
    },
    postprocessor: createDefaultPostprocessor({
      scoreThreshold: 0.5,
      debug: true,
    }),
    generator: mockGenerator,
  });

  const result = await runtime.run({ query: { query: "test" } });

  expect(result.postRetrievalDebug).toBeDefined();
  expect(result.postRetrievalDebug!.totalCandidates).toBe(2);
  expect(result.postRetrievalDebug!.selectedCount).toBe(1);
  expect(result.postRetrievalDebug!.droppedCount).toBe(1);
  expect(result.postRetrievalDebug!.appliedScoreThreshold).toBe(0.5);
  expect(result.postRetrievalDebug!.selectionTrace).toBeDefined();
  expect(result.postRetrievalDebug!.droppedCandidates).toBeDefined();
});
