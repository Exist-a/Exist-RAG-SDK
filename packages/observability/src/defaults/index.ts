import type { RedactionOptions } from "../types/redaction.js";
import type { SamplingOptions } from "../types/sampling.js";

/**
 * 默认脱敏配置
 */
export const DEFAULT_REDACTION: RedactionOptions = {
  maskContent: true,
  contentPreviewLength: 200,
  replacement: "[REDACTED]",
};

/**
 * 默认采样配置
 */
export const DEFAULT_SAMPLING: SamplingOptions = {
  rate: 1,
  alwaysSampleOnError: true,
};
