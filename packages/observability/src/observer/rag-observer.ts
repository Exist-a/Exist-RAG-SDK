import type { RAGObserver } from "../types/observer.js";
import type { RAGEvent } from "../types/event.js";
import type { RAGErrorRecord } from "../types/error-record.js";
import type { RAGTrace } from "../types/trace.js";
import type { TraceExporter } from "../types/exporter.js";
import type { RedactionOptions } from "../types/redaction.js";
import type { SamplingOptions } from "../types/sampling.js";
import { shouldSample } from "../sampling/index.js";
import { applyRedaction } from "../redaction/index.js";
import { safeInvoke, safeInvokeSync } from "../utils/index.js";

export type RAGObserverConfig = {
  exporters?: TraceExporter[];
  redaction?: RedactionOptions;
  sampling?: SamplingOptions;
};

/**
 * 创建组合型 RAG 观察器
 *
 * 集成采样、脱敏和多个 exporter，是生产环境推荐的 observer 构建方式。
 */
export function createRAGObserver(config?: RAGObserverConfig): RAGObserver {
  const exporters = config?.exporters ?? [];

  // 内部缓存：按 traceId 聚合事件
  const traceMap = new Map<string, RAGTrace>();

  function getOrCreateTrace(traceId: string): RAGTrace {
    if (!traceMap.has(traceId)) {
      traceMap.set(traceId, {
        traceId,
        scope: "runtime",
        startedAt: new Date().toISOString(),
        status: "ok",
        events: [],
      });
    }
    return traceMap.get(traceId)!;
  }

  return {
    async onEvent(event: RAGEvent) {
      await safeInvoke(async () => {
        const trace = getOrCreateTrace(event.traceId);
        trace.events.push(event);
        if (event.scope) {
          trace.scope = event.scope;
        }
      });
    },

    async onError(error: RAGErrorRecord) {
      await safeInvoke(async () => {
        const trace = getOrCreateTrace(error.traceId);
        trace.status = "error";
        trace.errors = trace.errors ?? [];
        trace.errors.push(error);
      });
    },

    async onTraceEnd(trace: RAGTrace) {
      await safeInvoke(async () => {
        // 应用采样
        if (!shouldSample(trace, config?.sampling)) {
          traceMap.delete(trace.traceId);
          return;
        }

        // 应用脱敏
        const redacted = config?.redaction
          ? {
              ...trace,
              events: trace.events.map((e) => ({
                ...e,
                attributes: e.attributes
                  ? applyRedaction(e.attributes as Record<string, unknown>, config.redaction)
                  : undefined,
              })),
            }
          : trace;

        // 导出到所有 exporter
        for (const exporter of exporters) {
          await safeInvoke(async () => exporter.export(redacted));
        }

        traceMap.delete(trace.traceId);
      });
    },

    async flush() {
      for (const exporter of exporters) {
        await safeInvoke(async () => exporter.flush?.());
      }
    },

    async shutdown() {
      for (const exporter of exporters) {
        await safeInvoke(async () => exporter.shutdown?.());
      }
    },
  };
}
