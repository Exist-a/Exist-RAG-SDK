import { ChromaVectorStore } from "../src/chroma/index.js";

async function main() {
  // 注意：运行此 demo 需要本地有 Chroma 服务
  const store = new ChromaVectorStore({
    url: "http://localhost:8000",
    collectionName: "demo-collection",
  });

  await store.upsert([
    { id: "v1", values: [1, 2, 3, 4], metadata: { tag: "a" } },
    { id: "v2", values: [5, 6, 7, 8], metadata: { tag: "b", score: 0.9 } },
  ]);

  console.log("Chroma 写入完成");
}

main().catch(console.error);
