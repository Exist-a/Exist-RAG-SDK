import type { RAGEvent } from "./event.js";
import type { RAGErrorRecord } from "./error-record.js";
import type { RAGTrace } from "./trace.js";

/**
 * RAG 观察器接口
 *
 * 用于接收 RAG 运行时的事件、错误和 trace 结束通知。
 * 所有方法均为可选，实现方可按需覆盖。
 */
export interface RAGObserver {
  onEvent?(event: RAGEvent): void | Promise<void>;
  onError?(error: RAGErrorRecord): void | Promise<void>;
  onTraceEnd?(trace: RAGTrace): void | Promise<void>;
  flush?(): void | Promise<void>;
  shutdown?(): void | Promise<void>;
}
