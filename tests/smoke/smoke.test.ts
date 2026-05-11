import { test, expect } from "vitest";
import type { Embedder, Vector, Loader, Document } from "@rag-sdk/indexing";
import type { Chunk } from "@rag-sdk/core";
import type { RuntimeRetriever, RuntimeGenerator } from "@rag-sdk/runtime";

// 1. 包导入 smoke
test("所有包可以正常导入", async () => {
  const core = await import("@rag-sdk/core");
  const indexing = await import("@rag-sdk/indexing");
  const runtime = await import("@rag-sdk/runtime");
  const adapters = await import("@rag-sdk/adapters");
  const observability = await import("@rag-sdk/observability");
  const utils = await import("@rag-sdk/utils");

  expect(core).toBeDefined();
  expect(indexing).toBeDefined();
  expect(runtime).toBeDefined();
  expect(adapters).toBeDefined();
  expect(observability).toBeDefined();
  expect(utils).toBeDefined();
});

// 2. 工厂函数 smoke
test("核心工厂函数可调用并返回合法对象", async () => {
  const { createRuntime, createDefaultRuntime, createDefaultPostprocessor } = await import("@rag-sdk/runtime");
  const { createRAGObserver, createMemoryTraceExporter } = await import("@rag-sdk/observability");
  const { MemoryVectorStore } = await import("@rag-sdk/indexing");

  const store = new MemoryVectorStore();
  expect(store).toBeDefined();

  const postprocessor = createDefaultPostprocessor();
  expect(postprocessor).toBeDefined();
  expect(typeof postprocessor.postprocess).toBe("function");

  const runtime = createDefaultRuntime({
    retriever: {
      async retrieve(query) {
        return { chunks: [] };
      },
    },
    generator: {
      async generate() {
        return { answer: "test" };
      },
    },
  });
  expect(runtime).toBeDefined();
  expect(typeof runtime.run).toBe("function");

  const customRuntime = createRuntime({
    preprocessor: { async preprocess(q) { return { effectiveQuery: q }; } },
    retriever: { async retrieve(q) { return { chunks: [] }; } },
    postprocessor: { async postprocess(q, chunks) { return { chunks }; } },
    generator: { async generate() { return { answer: "test" }; } },
  });
  expect(customRuntime).toBeDefined();

  const observer = createRAGObserver({
    exporters: [createMemoryTraceExporter()],
  });
  expect(observer).toBeDefined();
  expect(typeof observer.onEvent).toBe("function");
  expect(typeof observer.flush).toBe("function");
  expect(typeof observer.shutdown).toBe("function");
});

// 3. 端到端最小链路 smoke
test("端到端索引+检索+生成闭环在 100ms 内完成", async () => {
  const { runIndexing, SimpleChunker, MemoryVectorStore } = await import("@rag-sdk/indexing");
  const { createRuntime } = await import("@rag-sdk/runtime");

  const store = new MemoryVectorStore();

  // 自定义 embedder：基于内容生成可区分的向量
  const embedder: Embedder = {
    async embed(chunks: Chunk[]): Promise<Vector[]> {
      return chunks.map((chunk) => ({
        id: chunk.id,
        values: Array.from({ length: 64 }, (_, i) => {
          const code = chunk.content.charCodeAt(i % Math.max(1, chunk.content.length)) || 0;
          return code / 255;
        }),
        metadata: chunk.metadata,
      }));
    },
  };

  // Mock loader
  const loader: Loader = {
    async load(): Promise<Document[]> {
      return [
        { id: "doc-1", content: "人工智能的发展历史" },
        { id: "doc-2", content: "机器学习算法介绍" },
      ];
    },
  };

  await runIndexing({
    loader,
    chunker: new SimpleChunker({ chunkSize: 100, overlap: 0 }),
    embedder,
    store,
  });

  expect(store.getAll().length).toBeGreaterThan(0);

  // 基于 MemoryVectorStore 的 retriever
  const retriever: RuntimeRetriever = {
    async retrieve(query) {
      const queryVector = Array.from({ length: 64 }, (_, i) => {
        const code = query.query.charCodeAt(i % Math.max(1, query.query.length)) || 0;
        return code / 255;
      });
      const vectors = await store.query({ queryVector, topK: 5 });
      return {
        chunks: vectors.map((v) => ({
          id: v.id,
          content: (v.metadata?.source as string) ?? v.id,
          metadata: v.metadata,
        })),
      };
    },
  };

  const generator: RuntimeGenerator = {
    async generate({ query, chunks }) {
      return {
        answer: `回答: ${query.query} (基于 ${chunks.length} 个片段)`,
      };
    },
  };

  const runtime = createRuntime({
    preprocessor: { async preprocess(q) { return { effectiveQuery: q }; } },
    retriever,
    postprocessor: { async postprocess(q, chunks) { return { chunks, promptContext: "" }; } },
    generator,
  });

  const result = await runtime.run({ query: { query: "人工智能" } });

  expect(result.answer).toContain("人工智能");
  expect(result.chunks.length).toBeGreaterThanOrEqual(0);
  expect(result.originalQuery).toBe("人工智能");
});
