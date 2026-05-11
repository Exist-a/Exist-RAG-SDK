import type { TraceExporter } from "../types/exporter.js";

/**
 * 空导出器
 *
 * 不执行任何操作，用于默认兜底或测试占位。
 */
export const NoopExporter: TraceExporter = {
  async export() {},
  async flush() {},
  async shutdown() {},
};

export function createNoopExporter(): TraceExporter {
  return NoopExporter;
}
