import { test, expect } from "vitest";
import { Document as LCDocument } from "@langchain/core/documents";
import {
  fromLangChainDocument,
  toLangChainDocument,
  fromLangChainChunks,
} from "../src/langchain/index.js";

test("toLangChainDocument 将 SDK Document 转换为 LangChain Document", () => {
  const sdkDoc = {
    id: "doc-1",
    content: "hello world",
    metadata: { source: "test.md", author: "alice" },
  };

  const lcDoc = toLangChainDocument(sdkDoc);

  expect(lcDoc).toBeInstanceOf(LCDocument);
  expect(lcDoc.pageContent).toBe("hello world");
  expect(lcDoc.metadata.id).toBe("doc-1");
  expect(lcDoc.metadata.source).toBe("test.md");
  expect(lcDoc.metadata.author).toBe("alice");
});

test("fromLangChainDocument 将 LangChain Document 转换为 SDK Document", () => {
  const lcDoc = new LCDocument({
    pageContent: "hello world",
    metadata: { id: "doc-1", source: "test.md" },
  });

  const sdkDoc = fromLangChainDocument(lcDoc);

  expect(sdkDoc.id).toBe("doc-1");
  expect(sdkDoc.content).toBe("hello world");
  expect(sdkDoc.metadata?.source).toBe("test.md");
});

test("toLangChainDocument 与 fromLangChainDocument round-trip 一致性", () => {
  const original = {
    id: "doc-1",
    content: "round trip content",
    metadata: { tag: "test" },
  };

  const lcDoc = toLangChainDocument(original);
  const recovered = fromLangChainDocument(lcDoc);

  expect(recovered.id).toBe(original.id);
  expect(recovered.content).toBe(original.content);
  expect(recovered.metadata?.tag).toBe("test");
});

test("fromLangChainChunks 过滤空白 content", () => {
  const sourceDoc = { id: "doc-1", content: "source" };
  const lcDocs = [
    new LCDocument({ pageContent: "real content" }),
    new LCDocument({ pageContent: "   " }),
    new LCDocument({ pageContent: "" }),
  ];

  const chunks = fromLangChainChunks(lcDocs, sourceDoc);

  expect(chunks.length).toBe(1);
  expect(chunks[0].content).toBe("real content");
});

test("fromLangChainChunks 合并 sourceDocument metadata", () => {
  const sourceDoc = { id: "doc-1", content: "source", metadata: { project: "rag" } };
  const lcDocs = [
    new LCDocument({ pageContent: "chunk", metadata: { section: "intro" } }),
  ];

  const chunks = fromLangChainChunks(lcDocs, sourceDoc);

  expect(chunks[0].metadata).toMatchObject({
    project: "rag",
    section: "intro",
    sourceDocumentId: "doc-1",
    chunkIndex: 0,
  });
});
