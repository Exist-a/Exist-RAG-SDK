import { test, expect } from "vitest";
import { Embeddings } from "@langchain/core/embeddings";
import { LangChainEmbedderAdapter } from "../src/langchain/index.js";

class MockEmbeddings extends Embeddings {
  private size: number;

  constructor(size = 64) {
    super({});
    this.size = size;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return documents.map(() => new Array(this.size).fill(0).map((_, i) => i));
  }

  async embedQuery(_document: string): Promise<number[]> {
    return new Array(this.size).fill(0).map((_, i) => i);
  }
}

test("正常生成 Vector", async () => {
  const embedder = new LangChainEmbedderAdapter(new MockEmbeddings(64));

  const vectors = await embedder.embed([
    { id: "c1", content: "测试1", metadata: { x: 1 } },
    { id: "c2", content: "测试2", metadata: { x: 2 } },
  ]);

  expect(vectors.length).toBe(2);
  expect(vectors[0].id).toBe("c1");
  expect(vectors[0].values.length).toBe(64);
  expect(vectors[0].metadata).toMatchObject({ x: 1 });
});

test("空输入直接返回 []", async () => {
  const embedder = new LangChainEmbedderAdapter(new MockEmbeddings(64));

  const vectors = await embedder.embed([]);
  expect(vectors).toEqual([]);
});

test("向量数量不匹配时报错", async () => {
  const fakeEmbeddings = new MockEmbeddings(64);

  // 模拟 embedDocuments 返回错误数量
  fakeEmbeddings.embedDocuments = async () => {
    return [[1, 2, 3]];
  };

  const embedder = new LangChainEmbedderAdapter(fakeEmbeddings);

  await expect(
    embedder.embed([
      { id: "c1", content: "测试1" },
      { id: "c2", content: "测试2" },
    ])
  ).rejects.toThrow("向量数量不匹配");
});
