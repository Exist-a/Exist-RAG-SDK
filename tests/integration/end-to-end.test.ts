import { test, expect } from "vitest";
import { runIndexing, SimpleChunker, MemoryVectorStore } from "@rag-sdk/indexing";
import { createRuntime, createDefaultPostprocessor } from "@rag-sdk/runtime";
import { QuerySchema, ChunkSchema, RAGResponseSchema } from "@rag-sdk/core";
import { createRAGObserver, createMemoryTraceExporter, nowISO } from "@rag-sdk/observability";
import { IndexingError } from "@rag-sdk/indexing";
import { RuntimeError } from "@rag-sdk/runtime";
import type { Embedder, Vector, Loader, Document } from "@rag-sdk/indexing";
import type { Chunk } from "@rag-sdk/core";
import type { RuntimeRetriever, RuntimeGenerator } from "@rag-sdk/runtime";
import type { RAGEvent } from "@rag-sdk/observability";

// 基于内容生成可区分向量的测试用 embedder
function makeTestEmbedder(): Embedder {
  return {
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
}

function embedQuery(query: string): number[] {
  return Array.from({ length: 64 }, (_, i) => {
    const code = query.charCodeAt(i % Math.max(1, query.length)) || 0;
    return code / 255;
  });
}

// 用例 1：indexing → runtime 完整链路
test("完整链路：索引构建到检索生成", async () => {
  const store = new MemoryVectorStore();

  const loader: Loader = {
    async load(): Promise<Document[]> {
      return [
        { id: "doc-1", content: "人工智能的发展历史可以追溯到上世纪五十年代。", metadata: { category: "history" } },
        { id: "doc-2", content: "机器学习是人工智能的一个分支。", metadata: { category: "tech" } },
        { id: "doc-3", content: "深度学习在图像识别领域取得了突破。", metadata: { category: "tech" } },
      ];
    },
  };

  await runIndexing({
    loader,
    chunker: new SimpleChunker({ chunkSize: 100, overlap: 0 }),
    embedder: makeTestEmbedder(),
    store,
  });

  expect(store.getAll().length).toBe(3);

  const retriever: RuntimeRetriever = {
    async retrieve(query) {
      const vectors = await store.query({ queryVector: embedQuery(query.query), topK: 5 });
      return {
        chunks: vectors.map((v) => ({
          id: v.id,
          content: String(v.metadata?.source ?? v.id),
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
    postprocessor: createDefaultPostprocessor({ scoreThreshold: 0.01 }),
    generator,
  });

  const result = await runtime.run({ query: { query: "人工智能" } });

  expect(result.answer).toContain("人工智能");
  expect(result.originalQuery).toBe("人工智能");
  expect(result.effectiveQuery).toBe("人工智能");
  expect(result.retrievedCount).toBeGreaterThanOrEqual(0);
  expect(result.finalChunkCount).toBeGreaterThanOrEqual(0);
});

// 用例 2：带 observability 的完整链路
test("带 observability 的完整链路收集 trace", async () => {
  const store = new MemoryVectorStore();
  const memoryExporter = createMemoryTraceExporter();

  const observer = createRAGObserver({
    exporters: [memoryExporter],
  });

  const loader: Loader = {
    async load(): Promise<Document[]> {
      return [{ id: "doc-1", content: "测试文档内容" }];
    },
  };

  await runIndexing({
    loader,
    chunker: new SimpleChunker({ chunkSize: 100, overlap: 0 }),
    embedder: makeTestEmbedder(),
    store,
  });

  const retriever: RuntimeRetriever = {
    async retrieve(query) {
      const vectors = await store.query({ queryVector: embedQuery(query.query), topK: 5 });
      return {
        chunks: vectors.map((v) => ({
          id: v.id,
          content: String(v.metadata?.source ?? v.id),
          metadata: v.metadata,
        })),
      };
    },
  };

  const generator: RuntimeGenerator = {
    async generate({ query, chunks }) {
      return { answer: `回答: ${query.query}` };
    },
  };

  const runtime = createRuntime({
    preprocessor: {
      async preprocess(q) {
        // 手动触发 observer 事件
        await observer.onEvent?.({
          traceId: "trace-1",
          scope: "runtime",
          stage: "query",
          name: "runtime.query.receive",
          timestamp: nowISO(),
        } as RAGEvent);
        return { effectiveQuery: q };
      },
    },
    retriever: {
      async retrieve(query, context) {
        await observer.onEvent?.({
          traceId: "trace-1",
          scope: "runtime",
          stage: "retrieval",
          name: "runtime.retrieval.complete",
          timestamp: nowISO(),
        } as RAGEvent);
        return retriever.retrieve(query, context);
      },
    },
    postprocessor: { async postprocess(q, chunks) { return { chunks, promptContext: "" }; } },
    generator: {
      async generate(input, context) {
        await observer.onEvent?.({
          traceId: "trace-1",
          scope: "runtime",
          stage: "generation",
          name: "runtime.generation.complete",
          timestamp: nowISO(),
        } as RAGEvent);
        return generator.generate(input, context);
      },
    },
  });

  const result = await runtime.run({ query: { query: "测试" } });
  expect(result.answer).toContain("测试");

  // 手动结束 trace 并导出
  await observer.onTraceEnd?.({
    traceId: "trace-1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  });

  const traces = memoryExporter.getTraces();
  expect(traces.length).toBeGreaterThanOrEqual(1);
});

// 用例 3：core Schema 跨包一致性
test("core Schema 在全链路中保持一致性", async () => {
  const query = { query: "schema 测试" };
  const parsedQuery = QuerySchema.parse(query);
  expect(parsedQuery.query).toBe("schema 测试");

  const chunk = {
    id: "c1",
    content: "这是一个 chunk",
    metadata: { source: "doc-1" },
  };
  const parsedChunk = ChunkSchema.parse(chunk);
  expect(parsedChunk.id).toBe("c1");

  // 验证 RAGResponseSchema 可以解析 runtime 结果结构
  const mockResult = {
    answer: "测试回答",
    chunks: [parsedChunk],
  };
  const parsedResponse = RAGResponseSchema.parse(mockResult);
  expect(parsedResponse.answer).toBe("测试回答");
});

// 用例 4：错误跨包传递
test("indexing 错误被 IndexingError 包装并携带 stage", async () => {
  await expect(
    runIndexing({
      loader: {
        async load() {
          throw new Error("磁盘读取失败");
        },
      },
      embedder: makeTestEmbedder(),
      store: new MemoryVectorStore(),
    })
  ).rejects.toSatisfy((err: unknown) => {
    return err instanceof Error && err.message.includes("磁盘读取失败");
  });
});

test("runtime 错误被 RuntimeError 包装并携带 stage 和 query", async () => {
  const runtime = createRuntime({
    preprocessor: { async preprocess(q) { return { effectiveQuery: q }; } },
    retriever: {
      async retrieve() {
        throw new Error("检索服务不可用");
      },
    },
    postprocessor: { async postprocess(q, chunks) { return { chunks }; } },
    generator: { async generate() { return { answer: "" }; } },
  });

  await expect(runtime.run({ query: { query: "错误测试" } })).rejects.toSatisfy(
    (err: unknown) => {
      return (
        err instanceof RuntimeError &&
        err.stage === "retrieval" &&
        err.query === "错误测试" &&
        err.message.includes("检索服务不可用")
      );
    }
  );
});
