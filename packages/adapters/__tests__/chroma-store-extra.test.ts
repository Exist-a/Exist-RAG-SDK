import { test, expect, vi } from "vitest";
import { ChromaVectorStore } from "../src/chroma/index.js";

function createMockCollection() {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockClient(collection: ReturnType<typeof createMockCollection>) {
  return {
    getOrCreateCollection: vi.fn().mockResolvedValue(collection),
  } as unknown as import("chromadb").ChromaClient;
}

test("collectionConfiguration 被正确传入 getOrCreateCollection", async () => {
  const collection = createMockCollection();
  const client = createMockClient(collection);
  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
    collectionConfiguration: { hnsw_configuration: { space: "cosine" } },
  });

  await store.upsert([{ id: "v1", values: [1, 2, 3] }]);

  expect(client.getOrCreateCollection).toHaveBeenCalledWith(
    expect.objectContaining({
      configuration: { hnsw_configuration: { space: "cosine" } },
    })
  );
});

test("collectionMetadata 被正确传入 getOrCreateCollection", async () => {
  const collection = createMockCollection();
  const client = createMockClient(collection);
  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
    collectionMetadata: { description: "test collection" },
  });

  await store.upsert([{ id: "v1", values: [1, 2, 3] }]);

  expect(client.getOrCreateCollection).toHaveBeenCalledWith(
    expect.objectContaining({
      metadata: { description: "test collection" },
    })
  );
});

test("url 参数构造 client 分支", async () => {
  // 验证构造函数不抛错即可，真实 client 构造会尝试连接
  const store = new ChromaVectorStore({
    url: "http://localhost:8000",
    collectionName: "test",
  });

  expect(store).toBeDefined();
});
