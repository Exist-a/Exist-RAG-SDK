import { test, expect } from "vitest";
import { createRuntime, createDefaultRuntime } from "../src/index.js";
import type { RuntimeRetriever, RuntimeGenerator } from "../src/index.js";

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

test("createRuntime 完整链路", async () => {
  const runtime = createDefaultRuntime({
    retriever: mockRetriever,
    generator: mockGenerator,
  });

  const result = await runtime.run({ query: { query: "测试" } });

  expect(result.answer).toBe("回答: 测试 (基于 2 个片段)");
  expect(result.chunks).toHaveLength(2);
  expect(result.originalQuery).toBe("测试");
  expect(result.effectiveQuery).toBe("测试");
  expect(result.retrievedCount).toBe(2);
  expect(result.finalChunkCount).toBe(2);
  expect(result.promptContext).toBeDefined();
});

test("自定义四阶段组件", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return {
          effectiveQuery: { query: `[改写] ${query.query}` },
          topK: 3,
        };
      },
    },
    retriever: mockRetriever,
    postprocessor: {
      async postprocess(_query, chunks) {
        return {
          chunks: chunks.slice(0, 1),
          promptContext: "custom context",
        };
      },
    },
    generator: mockGenerator,
  });

  const result = await runtime.run({ query: { query: "原始问题" } });

  expect(result.effectiveQuery).toBe("[改写] 原始问题");
  expect(result.retrievedCount).toBe(2);
  expect(result.finalChunkCount).toBe(1);
  expect(result.promptContext).toBe("custom context");
});

test("中间结果透传", async () => {
  const runtime = createRuntime({
    preprocessor: {
      async preprocess(query) {
        return {
          effectiveQuery: query,
          metadata: { pre: true },
        };
      },
    },
    retriever: {
      async retrieve(query) {
        return {
          chunks: [{ id: "c1", content: query.query }],
          metadata: { retrieval: true },
        };
      },
    },
    postprocessor: {
      async postprocess(_query, chunks) {
        return {
          chunks,
          metadata: { post: true },
        };
      },
    },
    generator: {
      async generate() {
        return {
          answer: "ok",
          metadata: { gen: true },
        };
      },
    },
  });

  const result = await runtime.run({ query: { query: "test" } });

  expect(result.retrievalMetadata).toMatchObject({ retrieval: true });
  expect(result.postRetrievalMetadata).toMatchObject({ post: true });
  expect(result.generationMetadata).toMatchObject({ gen: true });
});
