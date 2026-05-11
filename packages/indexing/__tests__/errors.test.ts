import { test, expect } from "vitest";
import { IndexingError } from "../src/index.js";

test("IndexingError 继承 Error 并携带 stage", () => {
  const err = new IndexingError("文档加载失败", "load");
  expect(err).toBeInstanceOf(Error);
  expect(err).toBeInstanceOf(IndexingError);
  expect(err.message).toBe("文档加载失败");
  expect(err.stage).toBe("load");
});

test("IndexingError 支持不同的 stage", () => {
  const err = new IndexingError("存储失败", "store");
  expect(err.stage).toBe("store");
});
