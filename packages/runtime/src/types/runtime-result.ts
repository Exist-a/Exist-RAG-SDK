import type { Chunk } from "@rag-sdk/core";
import type { PostRetrievalDebug } from "./selection-trace.js";

/**
 * 运行时结果
 */
export type RuntimeResult = {
  answer: string;
  chunks: Chunk[];
  originalQuery: string;
  effectiveQuery: string;
  retrievedCount: number;
  finalChunkCount: number;
  promptContext?: string;
  retrievalMetadata?: Record<string, unknown>;
  postRetrievalMetadata?: Record<string, unknown>;
  generationMetadata?: Record<string, unknown>;
  /** post-retrieval 阶段的调试信息 */
  postRetrievalDebug?: PostRetrievalDebug;
};
