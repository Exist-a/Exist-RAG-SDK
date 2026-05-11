import type { RedactionOptions } from "../types/redaction.js";
import { DEFAULT_REDACTION } from "../defaults/index.js";

/**
 * 对数据对象应用脱敏策略
 *
 * 支持：
 * - 点路径字段脱敏（如 "user.email"）
 * - content / prompt / answer 类字段的 preview + mask
 */
export function applyRedaction(
  data: Record<string, unknown>,
  options?: RedactionOptions
): Record<string, unknown> {
  const opts = { ...DEFAULT_REDACTION, ...options };
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // 检查是否需要 content masking
    if (opts.maskContent && isContentLikeField(key)) {
      result[key] = maskContentValue(value, opts.contentPreviewLength ?? 200, opts.replacement ?? "[REDACTED]");
      continue;
    }

    // 检查字段是否在脱敏列表中
    if (opts.fields?.includes(key)) {
      result[key] = opts.replacement;
      continue;
    }

    // 递归处理嵌套对象
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = applyRedaction(value as Record<string, unknown>, {
        ...opts,
        fields: opts.fields
          ?.filter((f) => f.startsWith(`${key}.`))
          .map((f) => f.slice(key.length + 1)),
      });
      continue;
    }

    result[key] = value;
  }

  return result;
}

function isContentLikeField(key: string): boolean {
  const contentFields = ["content", "prompt", "answer", "query", "text", "document"];
  return contentFields.some((f) => key.toLowerCase().includes(f));
}

function maskContentValue(
  value: unknown,
  previewLength: number,
  replacement: string
): unknown {
  if (typeof value !== "string") return value;
  if (value.length <= previewLength) return value;
  return value.slice(0, previewLength) + `...${replacement}`;
}
