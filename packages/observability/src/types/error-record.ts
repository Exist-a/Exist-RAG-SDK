import type { RAGEventName } from "./event.js";

/**
 * RAG 错误记录
 *
 * 将 Error 序列化为 JSON-safe 结构，不保存 Error 原对象。
 */
export type RAGErrorRecord = {
  traceId: string;
  scope: "runtime" | "indexing";
  stage: string;
  name: RAGEventName;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  attributes?: Record<string, unknown>;
};
