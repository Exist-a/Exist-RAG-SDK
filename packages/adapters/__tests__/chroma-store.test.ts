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

test("空输入短路", async () => {
  const collection = createMockCollection();
  const client = createMockClient(collection);
  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
  });

  await store.upsert([]);
  expect(collection.upsert).not.toHaveBeenCalled();
});

test("lazy 创建 collection", async () => {
  const collection = createMockCollection();
  const client = createMockClient(collection);
  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
  });

  await store.upsert([{ id: "v1", values: [1, 2, 3] }]);
  expect(client.getOrCreateCollection).toHaveBeenCalledTimes(1);
});

test("多次 upsert 复用同一个 collection", async () => {
  const collection = createMockCollection();
  const client = createMockClient(collection);
  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
  });

  await store.upsert([{ id: "v1", values: [1, 2, 3] }]);
  await store.upsert([{ id: "v2", values: [4, 5, 6] }]);

  expect(client.getOrCreateCollection).toHaveBeenCalledTimes(1);
  expect(collection.upsert).toHaveBeenCalledTimes(2);
});

test("metadata 兼容转换", async () => {
  const collection = createMockCollection();
  const client = createMockClient(collection);
  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
  });

  await store.upsert([
    {
      id: "v1",
      values: [1, 2],
      metadata: {
        str: "hello",
        num: 42,
        bool: true,
        nil: null,
        arr: ["a", "b"] as unknown as string,
        mixed: [1, "a"] as unknown as string,
      },
    },
  ]);

  const callArgs = collection.upsert.mock.calls[0][0];
  expect(callArgs.metadatas[0].str).toBe("hello");
  expect(callArgs.metadatas[0].num).toBe(42);
  expect(callArgs.metadatas[0].bool).toBe(true);
  expect(callArgs.metadatas[0].nil).toBeNull();
  const meta = callArgs.metadatas[0] as Record<string, unknown>;
  expect(meta.arr).toEqual(["a", "b"]);
  expect(meta.mixed).toBe('[1,"a"]');
});

test("维度不一致时报错", async () => {
  const collection = createMockCollection();
  const client = createMockClient(collection);
  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
  });

  await expect(
    store.upsert([
      { id: "v1", values: [1, 2, 3] },
      { id: "v2", values: [4, 5] },
    ])
  ).rejects.toThrow("向量维度不一致");
});

test("collection 创建错误透传", async () => {
  const client = {
    getOrCreateCollection: vi.fn().mockRejectedValue(new Error("连接失败")),
  } as unknown as import("chromadb").ChromaClient;

  const store = new ChromaVectorStore({
    client,
    collectionName: "test",
  });

  await expect(
    store.upsert([{ id: "v1", values: [1, 2, 3] }])
  ).rejects.toThrow("连接失败");
});
