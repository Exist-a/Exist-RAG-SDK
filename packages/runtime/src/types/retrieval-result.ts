import type { Chunk } from "@rag-sdk/core";
import type { RetrievalCandidate } from "./retrieval-candidate.js";

/**
 * 检索结果
 */
export type RetrievalResult = {
  chunks: Chunk[];
  /** 带分数的检索候选（若 retriever 支持提供分数，可在此返回） */
  candidates?: RetrievalCandidate[];
  metadata?: Record<string, unknown>;
};
