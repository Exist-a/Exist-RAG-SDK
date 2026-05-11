import type { RAGTrace } from "./trace.js";

/**
 * Trace 导出器接口
 *
 * 负责将完整的 RAGTrace 输出到目标端（控制台、内存、文件、HTTP 等）。
 */
export interface TraceExporter {
  export(trace: RAGTrace): void | Promise<void>;
  flush?(): void | Promise<void>;
  shutdown?(): void | Promise<void>;
}
