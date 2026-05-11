import type { RAGEvent } from "./event.js";
import type { RAGMetric } from "./metric.js";
import type { RAGErrorRecord } from "./error-record.js";

/**
 * Trace 上下文
 */
export type TraceContext = {
  traceId: string;
  traceIdSource?: "generated" | "provided" | "requestId";
  requestId?: string;
  serviceName?: string;
  environment?: string;
  sampleId?: string;
  dataset?: string;
  version?: string;
  tags?: Record<string, string | number | boolean>;
};

/**
 * RAG Trace
 *
 * 一次 runtime.run 或 runIndexing 的顶层观测单元。
 */
export type RAGTrace = {
  traceId: string;
  traceIdSource?: "generated" | "provided" | "requestId";
  requestId?: string;
  scope: "runtime" | "indexing";
  serviceName?: string;
  environment?: string;
  sampleId?: string;
  dataset?: string;
  version?: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  status: "ok" | "error";
  tags?: Record<string, string | number | boolean>;
  events: RAGEvent[];
  errors?: RAGErrorRecord[];
  metrics?: RAGMetric[];
};
