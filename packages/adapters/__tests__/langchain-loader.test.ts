import { test, expect } from "vitest";
import { Document as LCDocument } from "@langchain/core/documents";
import {
  LangChainLoaderAdapter,
  fromLangChainDocument,
} from "../src/langchain/index.js";

test("正常加载并映射 Document", async () => {
  const fakeLoader = {
    async load() {
      return [
        new LCDocument({
          pageContent: "测试内容",
          metadata: { source: "test.md" },
        }),
      ];
    },
  };

  const adapter = new LangChainLoaderAdapter(fakeLoader);
  const docs = await adapter.load();

  expect(docs).toHaveLength(1);
  expect(docs[0].content).toBe("测试内容");
  expect(docs[0].metadata).toMatchObject({ source: "test.md" });
});

test("fallback id 生效", async () => {
  const fakeLoader = {
    async load() {
      return [
        new LCDocument({
          pageContent: "无 metadata 内容",
          metadata: {},
        }),
      ];
    },
  };

  const adapter = new LangChainLoaderAdapter(fakeLoader);
  const docs = await adapter.load();

  expect(docs[0].id).toBeDefined();
  expect(docs[0].id.length).toBeGreaterThan(0);
});

test("metadata 归一化", async () => {
  const lcDoc = new LCDocument({
    pageContent: "内容",
    metadata: {
      date: new Date("2024-01-01"),
      url: new URL("http://example.com"),
      big: BigInt(9007199254740991),
      mixed: [1, "a", true],
      normal: "ok",
    },
  });

  const doc = fromLangChainDocument(lcDoc);

  expect(doc.metadata?.date).toBe("2024-01-01T00:00:00.000Z");
  expect(doc.metadata?.url).toBe("http://example.com/");
  expect(doc.metadata?.big).toBe(9007199254740991);
  expect(doc.metadata?.mixed).toBe('[1,"a",true]');
  expect(doc.metadata?.normal).toBe("ok");
});
