import {
  createDefaultRuntime,
  NoopQueryPreprocessor,
  PassthroughRetrievalPostprocessor,
} from "../src/index.js";
import type { RuntimeRetriever, RuntimeGenerator } from "../src/index.js";

const retriever: RuntimeRetriever = {
  async retrieve(query) {
    return {
      chunks: [
        { id: "c1", content: `关于 "${query.query}" 的第一个片段` },
        { id: "c2", content: `关于 "${query.query}" 的第二个片段` },
      ],
    };
  },
};

const generator: RuntimeGenerator = {
  async generate({ query, chunks }) {
    return {
      answer: `基于 "${query.query}" 和 ${chunks.length} 个片段生成的回答`,
    };
  },
};

async function main() {
  // 方式 1: 使用 createDefaultRuntime 快速组装
  const runtime1 = createDefaultRuntime({ retriever, generator });
  const result1 = await runtime1.run({ query: { query: "RAG 是什么" } });
  console.log("【默认 Runtime】", result1.answer);

  // 方式 2: 手动组装四阶段
  const runtime2 = createDefaultRuntime({ retriever, generator });
  const result2 = await runtime2.run({ query: { query: "向量数据库" } });
  console.log("【手动 Runtime】", result2);
}

main();
