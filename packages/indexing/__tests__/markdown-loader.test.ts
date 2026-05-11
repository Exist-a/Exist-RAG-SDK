import { test, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MarkdownLoader } from "../src/index.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "rag-sdk-test-"));
});

afterEach(() => {
  // 清理临时目录中的所有文件和目录本身
  try {
    const entries = require("node:fs").readdirSync(tempDir);
    for (const entry of entries) {
      unlinkSync(join(tempDir, entry));
    }
    rmdirSync(tempDir);
  } catch {
    // 忽略清理错误
  }
});

test("MarkdownLoader 读取目录中的 md 文件", async () => {
  writeFileSync(join(tempDir, "a.md"), "# Hello\n\nWorld");
  writeFileSync(join(tempDir, "b.md"), "## Second");

  const loader = new MarkdownLoader({ path: tempDir });
  const docs = await loader.load();

  expect(docs.length).toBe(2);
  const ids = docs.map((d) => d.id).sort();
  expect(ids).toEqual(["a.md", "b.md"]);
  expect(docs[0].metadata?.source).toContain(tempDir);
});

test("MarkdownLoader 忽略非 md 文件", async () => {
  writeFileSync(join(tempDir, "a.md"), "# Hello");
  writeFileSync(join(tempDir, "b.txt"), "ignore me");

  const loader = new MarkdownLoader({ path: tempDir });
  const docs = await loader.load();

  expect(docs.length).toBe(1);
  expect(docs[0].id).toBe("a.md");
});

test("MarkdownLoader 空目录返回空数组", async () => {
  const loader = new MarkdownLoader({ path: tempDir });
  const docs = await loader.load();

  expect(docs).toEqual([]);
});
