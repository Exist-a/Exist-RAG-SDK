import type { TraceExporter } from "../types/exporter.js";
import type { RAGTrace } from "../types/trace.js";

export type ConsoleExporterOptions = {
  /** 是否美化输出 JSON（默认 true） */
  pretty?: boolean;
};

/**
 * 创建控制台导出器
 *
 * 将 RAGTrace 以 JSON 格式输出到 console。
 */
export function createConsoleExporter(
  options?: ConsoleExporterOptions
): TraceExporter {
  const pretty = options?.pretty ?? true;

  return {
    export(trace: RAGTrace) {
      if (pretty) {
        console.log("\n=== RAG Trace ===");
        console.log(JSON.stringify(trace, null, 2));
        console.log("=================\n");
      } else {
        console.log(JSON.stringify(trace));
      }
    },

    flush() {},
    shutdown() {},
  };
}
