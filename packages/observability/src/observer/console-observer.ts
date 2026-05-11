import type { RAGObserver } from "../types/observer.js";
import type { RAGEvent } from "../types/event.js";
import type { RAGErrorRecord } from "../types/error-record.js";
import type { RAGTrace } from "../types/trace.js";

export type ConsoleObserverOptions = {
  /** 日志级别：debug / info / warn / error */
  level?: "debug" | "info" | "warn" | "error";
};

/**
 * 创建控制台观察器
 *
 * 将事件、错误和 trace 摘要输出到 console。
 */
export function createConsoleObserver(
  options?: ConsoleObserverOptions
): RAGObserver {
  const level = options?.level ?? "info";
  const levels = ["debug", "info", "warn", "error"] as const;
  const minLevelIndex = levels.indexOf(level);

  function shouldLog(targetLevel: typeof levels[number]): boolean {
    return levels.indexOf(targetLevel) >= minLevelIndex;
  }

  return {
    onEvent(event: RAGEvent) {
      if (!shouldLog("info")) return;
      console.log(`[RAG Event] ${event.name} | trace=${event.traceId}`, {
        stage: event.stage,
        durationMs: event.durationMs,
        attributes: event.attributes,
      });
    },

    onError(error: RAGErrorRecord) {
      if (!shouldLog("error")) return;
      console.error(`[RAG Error] ${error.name} | trace=${error.traceId}`, {
        stage: error.stage,
        error: error.error,
      });
    },

    onTraceEnd(trace: RAGTrace) {
      if (!shouldLog("info")) return;
      console.log(`[RAG Trace] ${trace.traceId} | status=${trace.status} | duration=${trace.durationMs}ms`, {
        scope: trace.scope,
        eventCount: trace.events.length,
        errorCount: trace.errors?.length ?? 0,
      });
    },

    async flush() {},
    async shutdown() {},
  };
}
