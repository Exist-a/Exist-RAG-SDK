import { test, expect } from "vitest";
import { createRuntime, RuntimeError } from "../src/index.js";
import type { RuntimeRetriever, RuntimeGenerator } from "../src/index.js";
import { runPipeline } from "../src/pipeline/run-runtime.js";

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

test("runPipeline 四阶段正常流转并组装正确结果", async () => {
  const result = await runPipeline(
    { query: { query: "测试查询" } },
    {
      preprocessor: {
        async preprocess(query) {
          return { effectiveQuery: { query: query.query + "_enhanced" } };
        },
      },
      retriever: mockRetriever,
      postprocessor: {
        async postprocess(query, chunks) {
          return {
            chunks,
            promptContext: chunks.map((c) => c.content).join("\n"),
          };
        },
      },
      generator: mockGenerator,
    }
  );

  expect(result.answer).toBe("回答: 测试查询_enhanced (基于 2 个片段)");
  expect(result.originalQuery).toBe("测试查询");
  expect(result.effectiveQuery).toBe("测试查询_enhanced");
  expect(result.retrievedCount).toBe(2);
  expect(result.finalChunkCount).toBe(2);
  expect(result.promptContext).toContain("结果1:");
  expect(result.postRetrievalDebug).toBeUndefined();
});

test("runPipeline 当 postprocessor 提供 debug 信息时生成 postRetrievalDebug", async () => {
  const result = await runPipeline(
    { query: { query: "test" } },
    {
      preprocessor: {
        async preprocess(query) {
          return { effectiveQuery: query };
        },
      },
      retriever: {
        async retrieve() {
          return {
            chunks: [
              { id: "c1", content: "A" },
              { id: "c2", content: "B" },
            ],
          };
        },
      },
      postprocessor: {
        async postprocess() {
          return {
            chunks: [{ id: "c1", content: "A" }],
            selectedCandidates: [{ id: "c1", content: "A", score: 0.9 }],
            droppedCandidates: [
              {
                candidate: { id: "c2", content: "B", score: 0.3 },
                reason: "低分",
                stage: "threshold",
              },
            ],
            selectionTrace: [],
          };
        },
      },
      generator: mockGenerator,
    }
  );

  expect(result.postRetrievalDebug).toBeDefined();
  expect(result.postRetrievalDebug!.totalCandidates).toBe(2);
  expect(result.postRetrievalDebug!.selectedCount).toBe(1);
  expect(result.postRetrievalDebug!.droppedCount).toBe(1);
});

test("runStage 捕获异常并包装为 RuntimeError", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return { effectiveQuery: query };
      },
    },
    retriever: mockRetriever,
    postprocessor: {
      async postprocess() {
        throw new Error("后处理崩溃");
      },
    },
    generator: mockGenerator,
  });

  await expect(runtime.run({ query: { query: "test" } })).rejects.toSatisfy(
    (error: unknown) => {
      return (
        error instanceof RuntimeError &&
        error.stage === "post-retrieval" &&
        error.query === "test" &&
        error.message.includes("后处理崩溃")
      );
    }
  );
});

test("runStage 包装 generation 阶段错误并保留原始 cause", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return { effectiveQuery: query };
      },
    },
    retriever: mockRetriever,
    postprocessor: {
      async postprocess(query, chunks) {
        return { chunks, promptContext: "" };
      },
    },
    generator: {
      async generate() {
        const cause = new Error("底层生成服务故障");
        throw cause;
      },
    },
  });

  await expect(runtime.run({ query: { query: "test" } })).rejects.toSatisfy(
    (error: unknown) => {
      return (
        error instanceof RuntimeError &&
        error.stage === "generation" &&
        error.cause instanceof Error &&
        error.cause.message === "底层生成服务故障"
      );
    }
  );
});
