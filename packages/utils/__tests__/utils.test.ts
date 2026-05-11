import { test, expect } from "vitest";
import {
  jaccardSimilarity,
  ngramSet,
  generateFallbackId,
  generateChunkId,
  normalizeValue,
  normalizeMetadata,
  mergeMetadata,
  toError,
  getErrorMessage,
  getErrorCause,
  buildPromptContext,
} from "../src/index.js";

// ========== text/similarity ==========

test("ngramSet 生成正确的 n-gram 集合", () => {
  const set = ngramSet("hello", 2);
  expect(set).toEqual(new Set(["he", "el", "ll", "lo"]));
});

test("ngramSet 字符串长度小于 n 返回空集合", () => {
  expect(ngramSet("a", 2).size).toBe(0);
});

test("jaccardSimilarity 相同字符串返回 1", () => {
  expect(jaccardSimilarity("hello", "hello")).toBe(1);
});

test("jaccardSimilarity 完全不同的短字符串返回 0", () => {
  expect(jaccardSimilarity("ab", "cd")).toBe(0);
});

test("jaccardSimilarity 部分重叠返回合理值", () => {
  const sim = jaccardSimilarity("hello world", "hello there");
  expect(sim).toBeGreaterThan(0);
  expect(sim).toBeLessThan(1);
});

test("jaccardSimilarity 支持自定义 n", () => {
  expect(jaccardSimilarity("hello", "hello", 3)).toBe(1);
});

// ========== id ==========

test("generateFallbackId 相同内容生成相同 ID", () => {
  const id1 = generateFallbackId("same content");
  const id2 = generateFallbackId("same content");
  expect(id1).toBe(id2);
});

test("generateFallbackId 不同内容生成不同 ID", () => {
  const id1 = generateFallbackId("content a");
  const id2 = generateFallbackId("content b");
  expect(id1).not.toBe(id2);
});

test("generateFallbackId 默认长度为 16", () => {
  expect(generateFallbackId("test").length).toBe(16);
});

test("generateFallbackId 支持自定义长度", () => {
  expect(generateFallbackId("test", 8).length).toBe(8);
});

test("generateChunkId 正确拼接", () => {
  expect(generateChunkId("doc1", 3)).toBe("doc1-chunk-3");
});

// ========== metadata ==========

test("normalizeValue 基础类型原样返回", () => {
  expect(normalizeValue("str")).toBe("str");
  expect(normalizeValue(42)).toBe(42);
  expect(normalizeValue(true)).toBe(true);
  expect(normalizeValue(null)).toBe(null);
  expect(normalizeValue(undefined)).toBe(null);
});

test("normalizeValue Date 转为 ISO 字符串", () => {
  const d = new Date("2024-01-15");
  expect(normalizeValue(d)).toBe(d.toISOString());
});

test("normalizeValue URL 转为字符串", () => {
  expect(normalizeValue(new URL("https://example.com"))).toBe("https://example.com/");
});

test("normalizeValue bigint 转为 number", () => {
  expect(normalizeValue(BigInt(100))).toBe(100);
});

test("normalizeValue 同质数组原样返回", () => {
  expect(normalizeValue(["a", "b"])).toEqual(["a", "b"]);
  expect(normalizeValue([1, 2])).toEqual([1, 2]);
});

test("normalizeValue 异质数组 JSON 序列化", () => {
  expect(normalizeValue(["a", 1])).toBe('["a",1]');
});

test("normalizeValue 对象 JSON 序列化", () => {
  expect(normalizeValue({ a: 1 })).toBe('{"a":1}');
});

test("normalizeMetadata 空输入返回空对象", () => {
  expect(normalizeMetadata(undefined)).toEqual({});
});

test("normalizeMetadata 正常规范化", () => {
  const result = normalizeMetadata({
    str: "hello",
    num: 42,
    date: new Date("2024-01-15"),
    nested: { a: 1 },
  });
  expect(result.str).toBe("hello");
  expect(result.num).toBe(42);
  expect(typeof result.date).toBe("string");
  expect(result.nested).toBe('{"a":1}');
});

test("mergeMetadata 合并并覆盖", () => {
  const result = mergeMetadata({ a: "1", b: "2" }, { b: "3", c: "4" });
  expect(result).toEqual({ a: "1", b: "3", c: "4" });
});

// ========== errors ==========

test("toError Error 实例透传", () => {
  const err = new Error("test");
  expect(toError(err)).toBe(err);
});

test("toError 非 Error 包装为 Error", () => {
  const err = toError("string error");
  expect(err).toBeInstanceOf(Error);
  expect(err.message).toBe("string error");
});

test("getErrorMessage 获取消息", () => {
  expect(getErrorMessage(new Error("msg"))).toBe("msg");
  expect(getErrorMessage("raw")).toBe("raw");
});

test("getErrorCause Error 返回实例", () => {
  const err = new Error("cause");
  expect(getErrorCause(err)).toBe(err);
});

test("getErrorCause 非 Error 返回 undefined", () => {
  expect(getErrorCause("not error")).toBeUndefined();
});

// ========== formatting/prompt ==========

test("buildPromptContext 默认分隔符", () => {
  const result = buildPromptContext([
    { content: "a" },
    { content: "b" },
  ]);
  expect(result).toBe("a\n\nb");
});

test("buildPromptContext 自定义分隔符", () => {
  const result = buildPromptContext(
    [{ content: "a" }, { content: "b" }],
    " | "
  );
  expect(result).toBe("a | b");
});

test("buildPromptContext 空数组返回空字符串", () => {
  expect(buildPromptContext([])).toBe("");
});
