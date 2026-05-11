import type { SamplingOptions } from "../types/sampling.js";
import type { RAGTrace } from "../types/trace.js";
import { DEFAULT_SAMPLING } from "../defaults/index.js";

/**
 * 判断一个 trace 是否应该被采样
 *
 * 采样以 trace 为单位。错误 trace 在 alwaysSampleOnError=true 时强制保留。
 */
export function shouldSample(
  trace: RAGTrace,
  options?: SamplingOptions
): boolean {
  const opts = {
    ...DEFAULT_SAMPLING,
    ...options,
  };
  const rate = opts.rate ?? 1;
  const alwaysSampleOnError = opts.alwaysSampleOnError ?? true;

  // 错误强制采样
  if (alwaysSampleOnError && trace.status === "error") {
    return true;
  }

  // rate 为 1 时全部采样
  if (rate >= 1) return true;

  // rate 为 0 时全部丢弃（但错误已在上一步处理）
  if (rate <= 0) return false;

  // 按 traceId 做确定性采样（同一 traceId 结果稳定）
  const hash = hashString(trace.traceId);
  return (hash % 1000) / 1000 < rate;
}

/**
 * 简单的字符串哈希（FNV-1a）
 */
function hashString(s: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash);
}
