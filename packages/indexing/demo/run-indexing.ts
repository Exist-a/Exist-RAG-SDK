import {
  runIndexing,
  SimpleChunker,
  MockEmbedder,
  MemoryVectorStore,
} from "../src/index.js";
import type { Loader, Document } from "../src/index.js";

/**
 * 内存 Mock 加载器
 *
 * 直接返回预设文档，不依赖文件系统。
 */
class MockLoader implements Loader {
  async load(): Promise<Document[]> {
    return [
      {
        id: "doc-1",
        content:
          "RAG（Retrieval-Augmented Generation）是一种将检索与生成结合的技术。" +
          "它首先通过检索系统从外部知识库中找到与查询相关的文档片段，" +
          "然后将这些片段作为上下文输入到生成模型中，从而生成更准确、更可靠的回答。",
        metadata: { source: "demo" },
      },
      {
        id: "doc-2",
        content:
          "向量数据库是专门用于存储和检索高维向量的数据库系统。" +
          "在 RAG 系统中，向量数据库用于存储文档片段的嵌入向量，" +
          "并支持基于相似度的快速检索。常见的向量数据库包括 Chroma、Pinecone、Milvus 等。",
        metadata: { source: "demo" },
      },
    ];
  }
}

async function main() {
  const store = new MemoryVectorStore();

  const result = await runIndexing({
    loader: new MockLoader(),
    chunker: new SimpleChunker({ chunkSize: 100, overlap: 20 }),
    embedder: new MockEmbedder({ dimension: 128 }),
    store,
    shouldIndex: (doc) => doc.content.trim().length > 0,
    metadataBuilder: (doc, chunk) => ({
      documentId: doc.id,
      source: "demo",
      chunkIndex: chunk.id.split("-").pop() ?? "0",
    }),
  });

  console.log("索引结果:", result);
  console.log("存储的向量数:", store.getAll().length);
  console.log("向量示例:", store.getAll()[0]);
}

main();
