import { Document as LCDocument } from "@langchain/core/documents";
import {
  LangChainLoaderAdapter,
  RecursiveTextSplitter,
  LangChainEmbedderAdapter,
} from "../src/langchain/index.js";
import { SyntheticEmbeddings } from "@langchain/core/utils/testing";

// 模拟 LangChain 风格的加载器
class FakeLangChainLoader {
  async load(): Promise<LCDocument[]> {
    return [
      new LCDocument({
        pageContent: "第一段内容。第二段内容。第三段内容。",
        metadata: { source: "fake.md", author: "test" },
      }),
    ];
  }
}

async function main() {
  // 1. Loader 适配
  const loader = new LangChainLoaderAdapter(new FakeLangChainLoader());
  const docs = await loader.load();
  console.log("加载文档:", docs);

  // 2. Chunker 适配
  const chunker = new RecursiveTextSplitter({ chunkSize: 10, chunkOverlap: 2 });
  const chunks = await chunker.chunk(docs[0]);
  console.log("切分结果:", chunks);

  // 3. Embedder 适配
  const embedder = new LangChainEmbedderAdapter(new SyntheticEmbeddings({ vectorSize: 64 }));
  const vectors = await embedder.embed(chunks);
  console.log("嵌入向量:", vectors);
}

main();
