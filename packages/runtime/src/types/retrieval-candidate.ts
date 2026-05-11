import type { Chunk } from "@rag-sdk/core";

/**
 * 检索候选结果
 *
 * 在 Chunk 基础上增加检索阶段产生的分数和元数据。
 * 若 retriever 未提供 candidates，postprocessor 内部会基于 chunks 构造默认候选（score=0）。
 */
export type RetrievalCandidate = Chunk & {
  /** 检索分数，越高表示越相关 */
  score: number;
  /** 检索阶段附加的元数据（如距离、向量相似度等） */
  retrievalMetadata?: Record<string, unknown>;
};
