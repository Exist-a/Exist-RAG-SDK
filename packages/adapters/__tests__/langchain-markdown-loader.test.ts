import { test, expect } from "vitest";
import { LangChainMarkdownLoader } from "../src/langchain/index.js";

test("LangChainMarkdownLoader 构造后不抛错", () => {
  // 由于 LangChainMarkdownLoader 依赖 DirectoryLoader 和文件系统，
  // 在测试环境中直接加载可能会因路径不存在而抛错。
  // 此处主要验证构造函数可正常执行。
  const loader = new LangChainMarkdownLoader({ path: "/nonexistent" });
  expect(loader).toBeDefined();
});
