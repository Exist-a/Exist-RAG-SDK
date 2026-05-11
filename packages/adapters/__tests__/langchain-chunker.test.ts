import { test, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// 直接读取本地 tiktoken ranks 数据，避免测试时从网络下载
function loadGpt2Ranks(): Record<string, unknown> {
  const ranksPath = resolve(
    "node_modules/.pnpm/js-tiktoken@1.0.21/node_modules/js-tiktoken/dist/ranks/gpt2.js"
  );
  const content = readFileSync(ranksPath, "utf-8");
  const json = content.replace("export default ", "").replace(/;\s*$/, "");
  return JSON.parse(json);
}

import {
  RecursiveTextSplitter,
  TokenTextSplitterPreset,
  MarkdownTextSplitterPreset,
} from "../src/langchain/index.js";

test("递归切分正常", async () => {
  const chunker = new RecursiveTextSplitter({ chunkSize: 20, chunkOverlap: 4 });
  const chunks = await chunker.chunk({
    id: "doc-1",
    content: "这是第一段。这是第二段。这是第三段。",
  });

  expect(chunks.length).toBeGreaterThan(0);
  chunks.forEach((chunk) => {
    expect(chunk.content.length).toBeGreaterThan(0);
    expect(chunk.metadata?.sourceDocumentId).toBe("doc-1");
    expect(typeof chunk.metadata?.chunkIndex).toBe("number");
  });
});

test("空白 chunk 被跳过", async () => {
  const chunker = new RecursiveTextSplitter({ chunkSize: 5, chunkOverlap: 1 });
  const chunks = await chunker.chunk({
    id: "doc-2",
    content: "abc   def",
  });

  expect(chunks.every((c) => c.content.trim().length > 0)).toBe(true);
});

test("chunkIndex 递增", async () => {
  const chunker = new RecursiveTextSplitter({ chunkSize: 5, chunkOverlap: 1 });
  const chunks = await chunker.chunk({
    id: "doc-3",
    content: "abcdefghijklmnop",
  });

  const indices = chunks.map((c) => c.metadata?.chunkIndex as number);
  for (let i = 0; i < indices.length; i++) {
    expect(indices[i]).toBe(i);
  }
});

test("Token 切分预设可正常工作", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => loadGpt2Ranks(),
  })) as unknown as typeof fetch;

  try {
    const chunker = new TokenTextSplitterPreset({ chunkSize: 10, chunkOverlap: 2 });
    const chunks = await chunker.chunk({
      id: "doc-4",
      content: "Hello world this is a test document for token splitting.",
    });

    expect(chunks.length).toBeGreaterThan(0);
  } finally {
    globalThis.fetch = originalFetch;
  }
}, 30000);

test("Markdown 切分预设可正常工作", async () => {
  const chunker = new MarkdownTextSplitterPreset({ chunkSize: 50, chunkOverlap: 10 });
  const chunks = await chunker.chunk({
    id: "doc-5",
    content: "# 标题\n\n第一段内容。\n\n## 子标题\n\n第二段内容。",
  });

  expect(chunks.length).toBeGreaterThan(0);
});
