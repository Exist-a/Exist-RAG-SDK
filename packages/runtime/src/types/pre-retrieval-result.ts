import type { Query } from "@rag-sdk/core";

/**
 * 检索前处理结果
 */
export type PreRetrievalResult = {
  effectiveQuery: Query;
  topK?: number;
  filters?: Record<string, unknown>;
  strategy?: string;
  route?: string;
  rewriteReason?: string;
  metadata?: Record<string, unknown>;
};
