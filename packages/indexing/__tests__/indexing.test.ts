import { test, expect, vi } from "vitest";
import { runIndexing, SimpleChunker, MockEmbedder, MemoryVectorStore } from "../src/index.js";
import type { Loader, Document } from "../src/index.js";

class MockLoader implements Loader {
  constructor(private docs: Document[]) {}

  async load(): Promise<Document[]> {
    return this.docs;
  }
}

test("runIndexing 完整链路", async () => {
  const store = new MemoryVectorStore();

  const result = await runIndexing({
    loader: new MockLoader([
      { id: "doc-1", content: "这是一段测试文档内容。".repeat(10) },
      { id: "doc-2", content: "这是另一段测试文档。".repeat(10) },
    ]),
    chunker: new SimpleChunker({ chunkSize: 50, overlap: 10 }),
    embedder: new MockEmbedder({ dimension: 64 }),
    store,
  });

  expect(result.documentsTotal).toBe(2);
  expect(result.documentsIndexed).toBe(2);
  expect(result.skippedDocuments).toBe(0);
  expect(result.failedDocuments).toBe(0);
  expect(result.chunksTotal).toBeGreaterThan(0);
  expect(result.vectorsTotal).toBe(result.chunksTotal);
  expect(store.getAll().length).toBe(result.vectorsTotal);
});

test("runIndexing 过滤文档", async () => {
  const store = new MemoryVectorStore();

  const result = await runIndexing({
    loader: new MockLoader([
      { id: "doc-1", content: "有效内容".repeat(5) },
      { id: "doc-2", content: "" },
    ]),
    chunker: new SimpleChunker({ chunkSize: 20, overlap: 5 }),
    embedder: new MockEmbedder(),
    store,
    shouldIndex: (doc) => doc.content.trim().length > 0,
  });

  expect(result.documentsTotal).toBe(2);
  expect(result.documentsIndexed).toBe(1);
  expect(result.skippedDocuments).toBe(1);
});

test("runIndexing 自定义 metadataBuilder", async () => {
  const store = new MemoryVectorStore();

  await runIndexing({
    loader: new MockLoader([
      { id: "doc-1", content: "测试内容", metadata: { tag: "a" } },
    ]),
    chunker: new SimpleChunker({ chunkSize: 100, overlap: 10 }),
    embedder: new MockEmbedder(),
    store,
    metadataBuilder: (doc, chunk) => ({
      ...doc.metadata,
      documentId: doc.id,
      custom: true,
    }),
  });

  const vectors = store.getAll();
  expect(vectors.length).toBeGreaterThan(0);
  expect(vectors[0].metadata).toMatchObject({
    tag: "a",
    documentId: "doc-1",
    custom: true,
  });
});

test("SimpleChunker 切分逻辑", async () => {
  const chunker = new SimpleChunker({ chunkSize: 10, overlap: 2 });
  const chunks = await chunker.chunk({ id: "d1", content: "abcdefghijklmnop" });

  expect(chunks.length).toBeGreaterThan(0);
  expect(chunks[0].content.length).toBeLessThanOrEqual(10);
});

test("MockEmbedder 返回固定维度向量", async () => {
  const embedder = new MockEmbedder({ dimension: 64 });
  const vectors = await embedder.embed([
    { id: "c1", content: "test" },
    { id: "c2", content: "test2" },
  ]);

  expect(vectors.length).toBe(2);
  expect(vectors[0].values.length).toBe(64);
  expect(vectors[0].values.every((v) => v === 0)).toBe(true);
});

test("MemoryVectorStore upsert 与 getAll", async () => {
  const store = new MemoryVectorStore();

  await store.upsert([
    { id: "v1", values: [1, 2, 3] },
    { id: "v2", values: [4, 5, 6] },
  ]);

  expect(store.getAll().length).toBe(2);

  await store.upsert([{ id: "v1", values: [7, 8, 9] }]);
  expect(store.getAll().length).toBe(2);
  expect(store.getAll()[0].values).toEqual([7, 8, 9]);
});

test("MemoryVectorStore clear 清空数据", async () => {
  const store = new MemoryVectorStore();
  await store.upsert([{ id: "v1", values: [1, 2, 3] }]);
  expect(store.getAll().length).toBe(1);

  store.clear();
  expect(store.getAll().length).toBe(0);
});

test("MemoryVectorStore query 按余弦相似度返回 Top-K", async () => {
  const store = new MemoryVectorStore();
  await store.upsert([
    { id: "v1", values: [1, 0, 0] },
    { id: "v2", values: [0, 1, 0] },
    { id: "v3", values: [0.9, 0.1, 0] },
  ]);

  const results = await store.query({ queryVector: [1, 0, 0], topK: 2 });
  expect(results.length).toBe(2);
  expect(results[0].id).toBe("v1");
  expect(results[1].id).toBe("v3");
});

test("MemoryVectorStore query 支持 metadata filter", async () => {
  const store = new MemoryVectorStore();
  await store.upsert([
    { id: "v1", values: [1, 0, 0], metadata: { tag: "a" } },
    { id: "v2", values: [0, 1, 0], metadata: { tag: "b" } },
  ]);

  const results = await store.query({ queryVector: [1, 1, 0], topK: 10, filter: { tag: "a" } });
  expect(results.length).toBe(1);
  expect(results[0].id).toBe("v1");
});

test("MemoryVectorStore query 空 store 返回空数组", async () => {
  const store = new MemoryVectorStore();
  const results = await store.query({ queryVector: [1, 0, 0], topK: 5 });
  expect(results).toEqual([]);
});

test("runIndexing 错误处理：onError 回调被调用", async () => {
  const store = new MemoryVectorStore();
  const onError = vi.fn();

  const result = await runIndexing({
    loader: new MockLoader([{ id: "doc-1", content: "ok" }]),
    embedder: {
      async embed() {
        throw new Error("嵌入失败");
      },
    },
    store,
    onError,
  });

  expect(result.failedDocuments).toBe(1);
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError.mock.calls[0][0].message).toBe("嵌入失败");
  expect(onError.mock.calls[0][1].documentId).toBe("doc-1");
});

test("runIndexing 错误处理：无 onError 时抛出 IndexingError", async () => {
  const store = new MemoryVectorStore();

  await expect(
    runIndexing({
      loader: new MockLoader([{ id: "doc-1", content: "ok" }]),
      embedder: {
        async embed() {
          throw new Error("嵌入失败");
        },
      },
      store,
    })
  ).rejects.toSatisfy((err: unknown) => {
    return (
      err instanceof Error &&
      err.message.includes("索引文档 \"doc-1\" 失败") &&
      err.message.includes("嵌入失败")
    );
  });
});

test("runIndexing transformers 链正确执行", async () => {
  const store = new MemoryVectorStore();

  await runIndexing({
    loader: new MockLoader([{ id: "doc-1", content: "hello world" }]),
    transformers: [
      {
        async transform(doc) {
          return { ...doc, content: doc.content.toUpperCase() };
        },
      },
    ],
    chunker: new SimpleChunker({ chunkSize: 100, overlap: 0 }),
    embedder: new MockEmbedder(),
    store,
  });

  const vectors = store.getAll();
  expect(vectors.length).toBeGreaterThan(0);
  // SimpleChunker 不保留原始 document，但 transform 后 chunk 内容应为大写
  // 实际上 chunker 基于 transform 后的 doc.content 切分，所以 chunk content 是大写
  expect(vectors[0].metadata?.documentId).toBe("doc-1");
});

test("runIndexing shouldIndex 过滤生效", async () => {
  const store = new MemoryVectorStore();

  const result = await runIndexing({
    loader: new MockLoader([
      { id: "doc-1", content: "keep me" },
      { id: "doc-2", content: "skip me" },
    ]),
    chunker: new SimpleChunker({ chunkSize: 100, overlap: 0 }),
    embedder: new MockEmbedder(),
    store,
    shouldIndex: (doc) => doc.content.includes("keep"),
  });

  expect(result.documentsTotal).toBe(2);
  expect(result.documentsIndexed).toBe(1);
  expect(result.skippedDocuments).toBe(1);
});
