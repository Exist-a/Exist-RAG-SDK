import { createRuntime } from "../src/index.js";
import type {
  QueryPreprocessor,
  RuntimeRetriever,
  RetrievalPostprocessor,
  RuntimeGenerator,
} from "../src/index.js";

/**
 * 自定义预处理器：在 query 前加上前缀
 */
const customPreprocessor: QueryPreprocessor = {
  async preprocess(query) {
    return {
      effectiveQuery: { query: `[增强] ${query.query}` },
      topK: 10,
      strategy: "enhanced",
    };
  },
};

/**
 * 自定义检索器
 */
const customRetriever: RuntimeRetriever = {
  async retrieve(query) {
    return {
      chunks: [
        { id: "c1", content: `检索结果 1 for: ${query.query}` },
        { id: "c2", content: `检索结果 2 for: ${query.query}` },
        { id: "c3", content: `检索结果 3 for: ${query.query}` },
      ],
    };
  },
};

/**
 * 自定义后处理器：只保留前 2 个 chunk
 */
const customPostprocessor: RetrievalPostprocessor = {
  async postprocess(_query, chunks) {
    const filtered = chunks.slice(0, 2);
    return {
      chunks: filtered,
      promptContext: filtered.map((c) => c.content).join("\n---\n"),
    };
  },
};

/**
 * 自定义生成器
 */
const customGenerator: RuntimeGenerator = {
  async generate({ query, chunks, promptContext }) {
    return {
      answer: `问题: ${query.query}\n使用了 ${chunks.length} 个片段\n上下文:\n${promptContext}`,
    };
  },
};

async function main() {
  const runtime = createRuntime({
    preprocessor: customPreprocessor,
    retriever: customRetriever,
    postprocessor: customPostprocessor,
    generator: customGenerator,
  });

  const result = await runtime.run({ query: { query: "自定义 Runtime 演示" } });
  console.log("回答:", result.answer);
  console.log("原始 query:", result.originalQuery);
  console.log("有效 query:", result.effectiveQuery);
  console.log("检索到:", result.retrievedCount, "个片段");
  console.log("最终使用:", result.finalChunkCount, "个片段");
}

main();
