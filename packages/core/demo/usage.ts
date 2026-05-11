import type {
  Retriever,
  Generator,
  Query,
  RAGResponse,
} from "../src/index.js";

async function run(
  retriever: Retriever,
  generator: Generator,
  query: Query
): Promise<RAGResponse> {
  const chunks = await retriever.retrieve(query);

  const answer = await generator.generate({
    query,
    chunks,
  });

  return {
    answer,
    chunks,
  };
}

async function main() {
  const mockRetriever: Retriever = {
    retrieve: async (query) => [
      {
        id: "chunk-1",
        content: `关于 "${query.query}" 的检索结果`,
        metadata: { source: "mock" },
      },
    ],
  };

  const mockGenerator: Generator = {
    generate: async ({ query, chunks }) => {
      return `基于 ${chunks.length} 个片段生成回答：${query.query}`;
    },
  };

  const result = await run(mockRetriever, mockGenerator, {
    query: "RAG 是什么",
  });

  console.log("回答:", result.answer);
  console.log("引用片段:", result.chunks);
}

main();
