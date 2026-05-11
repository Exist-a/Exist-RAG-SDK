import {
  createDefaultRuntime,
  createDefaultPostprocessor,
} from "../src/index.js";
import type { RuntimeRetriever, RuntimeGenerator } from "../src/index.js";

/**
 * 模拟检索器：返回带分数和来源的候选结果
 */
const retriever: RuntimeRetriever = {
  async retrieve(query) {
    return {
      chunks: [
        { id: "doc1-1", content: `关于 "${query.query}" 的第一段内容（来自文档1）`, metadata: { score: 0.95, source: "doc1" } },
        { id: "doc1-2", content: `关于 "${query.query}" 的第一段内容（来自文档1）`, metadata: { score: 0.92, source: "doc1" } },
        { id: "doc1-3", content: `关于 "${query.query}" 的第三段（文档1）`, metadata: { score: 0.88, source: "doc1" } },
        { id: "doc2-1", content: `关于 "${query.query}" 的摘要（文档2）`, metadata: { score: 0.85, source: "doc2" } },
        { id: "doc2-2", content: `关于 "${query.query}" 的详细说明（文档2）`, metadata: { score: 0.82, source: "doc2" } },
        { id: "doc3-1", content: `关于 "${query.query}" 的参考资料（文档3）`, metadata: { score: 0.78, source: "doc3" } },
        { id: "doc3-2", content: `关于 "${query.query}" 的补充信息（文档3）`, metadata: { score: 0.75, source: "doc3" } },
        { id: "doc4-1", content: `关于 "${query.query}" 的边缘内容（文档4）`, metadata: { score: 0.45, source: "doc4" } },
      ],
    };
  },
};

/**
 * 模拟生成器
 */
const generator: RuntimeGenerator = {
  async generate({ query, chunks, promptContext }) {
    return {
      answer: `基于 "${query.query}" 和 ${chunks.length} 个片段生成的回答`,
    };
  },
};

async function main() {
  console.log("=== 默认 Postprocessor 组合策略演示 ===\n");

  // 组合多种策略的 postprocessor
  const postprocessor = createDefaultPostprocessor({
    // 1. 分数阈值：过滤低质量结果
    scoreThreshold: 0.5,

    // 2. 近似去重：移除重复内容（保留分数更高的）
    nearDuplicate: true,

    // 3. 来源覆盖率：每个来源最多保留 2 条
    sourceCoverage: { maxPerSource: 2 },

    // 4. 预算裁剪：最终最多保留 5 条
    budget: { maxCandidates: 5 },

    // 5. 排序：按分数降序
    orderBy: "score",

    // 6. 开启调试信息
    debug: true,
  });

  const runtime = createDefaultRuntime({
    retriever,
    generator,
    postprocessor,
  });

  const result = await runtime.run({ query: { query: "RAG 检索后处理" } });

  console.log("【回答】", result.answer);
  console.log("【检索到】", result.retrievedCount, "个片段");
  console.log("【最终使用】", result.finalChunkCount, "个片段");
  console.log("\n【最终选中片段】");
  result.chunks.forEach((chunk, i) => {
    console.log(`  ${i + 1}. [${chunk.id}] ${chunk.content.substring(0, 40)}...`);
  });

  if (result.postRetrievalDebug) {
    const debug = result.postRetrievalDebug;
    console.log("\n【调试信息】");
    console.log(`  总候选数: ${debug.totalCandidates}`);
    console.log(`  选中数: ${debug.selectedCount}`);
    console.log(`  丢弃数: ${debug.droppedCount}`);
    console.log(`  分数阈值: ${debug.appliedScoreThreshold ?? "未设置"}`);
    if (debug.appliedBudget) {
      console.log(`  预算裁剪: ${debug.appliedBudget.beforeTrim} -> ${debug.appliedBudget.afterTrim}`);
    }

    if (debug.droppedCandidates && debug.droppedCandidates.length > 0) {
      console.log("\n【被丢弃的候选】");
      debug.droppedCandidates.forEach((dc) => {
        console.log(`  - ${dc.candidateId}: [${dc.stage}] ${dc.reason}`);
      });
    }

    if (debug.selectionTrace && debug.selectionTrace.length > 0) {
      console.log("\n【操作追踪（前10条）】");
      debug.selectionTrace.slice(0, 10).forEach((trace) => {
        console.log(
          `  [${trace.action}] ${trace.candidateId} (${trace.stage}): ${trace.reason}`
        );
      });
    }
  }

  console.log("\n=== 演示完成 ===");
}

main().catch(console.error);
