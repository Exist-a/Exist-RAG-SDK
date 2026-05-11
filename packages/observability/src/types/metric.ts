/**
 * RAG 指标
 */
export type RAGMetric = {
  traceId: string;
  name: string;
  value: number;
  unit?: "ms" | "count" | "tokens" | "ratio" | "bytes";
  scope?: "runtime" | "indexing";
  stage?: string;
  attributes?: Record<string, unknown>;
};
