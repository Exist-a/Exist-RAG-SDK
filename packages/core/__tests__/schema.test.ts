import { test, expect } from "vitest";
import { QuerySchema, ChunkSchema, RAGResponseSchema } from "../src/spec/index.js";

test("QuerySchema 校验有效输入", () => {
  const result = QuerySchema.parse({ query: "RAG 是什么" });
  expect(result).toEqual({ query: "RAG 是什么" });
});

test("QuerySchema 拒绝空字符串", () => {
  expect(() => QuerySchema.parse({ query: "" })).toThrow();
});

test("QuerySchema 拒绝缺少 query 字段", () => {
  expect(() => QuerySchema.parse({})).toThrow();
});

test("ChunkSchema 校验有效输入", () => {
  const result = ChunkSchema.parse({
    id: "chunk-1",
    content: "这是一段内容",
    metadata: { source: "docs", score: 0.9, valid: true, flag: null },
  });
  expect(result.id).toBe("chunk-1");
  expect(result.content).toBe("这是一段内容");
  expect(result.metadata).toEqual({
    source: "docs",
    score: 0.9,
    valid: true,
    flag: null,
  });
});

test("ChunkSchema 允许省略 metadata", () => {
  const result = ChunkSchema.parse({
    id: "chunk-2",
    content: "无 metadata",
  });
  expect(result.metadata).toBeUndefined();
});

test("ChunkSchema 拒绝缺少 id", () => {
  expect(() =>
    ChunkSchema.parse({ content: "缺少 id" })
  ).toThrow();
});

test("RAGResponseSchema 校验有效输入", () => {
  const result = RAGResponseSchema.parse({
    answer: "这是回答",
    chunks: [
      { id: "c1", content: "片段1" },
      { id: "c2", content: "片段2", metadata: { x: 1 } },
    ],
  });
  expect(result.answer).toBe("这是回答");
  expect(result.chunks).toHaveLength(2);
});

test("RAGResponseSchema 拒绝非法 chunk 结构", () => {
  expect(() =>
    RAGResponseSchema.parse({
      answer: "回答",
      chunks: [{ content: "缺少 id" }],
    })
  ).toThrow();
});
