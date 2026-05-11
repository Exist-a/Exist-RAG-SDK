import type { TraceExporter } from "../types/exporter.js";
import type { RAGTrace } from "../types/trace.js";

/**
 * 内存导出器
 *
 * 将 trace 存储在内存数组中，便于测试和本地复盘。
 */
export type MemoryTraceExporter = TraceExporter & {
  /** 获取所有已存储的 trace */
  getTraces(): RAGTrace[];
  /** 清空存储 */
  clear(): void;
  /** 获取最近一次存储的 trace */
  getLastTrace(): RAGTrace | undefined;
};

export function createMemoryTraceExporter(): MemoryTraceExporter {
  const traces: RAGTrace[] = [];

  return {
    export(trace: RAGTrace) {
      traces.push(trace);
    },

    getTraces() {
      return [...traces];
    },

    getLastTrace() {
      return traces.length > 0 ? traces[traces.length - 1] : undefined;
    },

    clear() {
      traces.length = 0;
    },

    flush() {},
    shutdown() {},
  };
}
