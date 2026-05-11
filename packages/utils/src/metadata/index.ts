/**
 * JSON 安全值类型
 */
export type JsonSafeValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[];

/**
 * 将单个值规范化为 JSON-safe 类型
 *
 * 处理规则：
 * - string / number / boolean → 原样返回
 * - null / undefined → null
 * - Date → ISO 字符串
 * - URL → 字符串
 * - bigint → number
 * - 同质基础类型数组 → 原样返回
 * - 其他（异质数组、对象等）→ JSON 序列化
 */
export function normalizeValue(value: unknown): JsonSafeValue {
  if (value === null || value === undefined) {
    return null;
  }

  const type = typeof value;

  if (type === "string" || type === "number" || type === "boolean") {
    return value as string | number | boolean;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof URL) {
    return value.toString();
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    const firstType = typeof value[0];
    const isHomogeneous = value.every((v) => typeof v === firstType);

    if (isHomogeneous && ["string", "number", "boolean"].includes(firstType)) {
      return value as string[] | number[] | boolean[];
    }

    return JSON.stringify(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * 将 metadata 对象整体规范化
 *
 * 对每一个值应用 {@link normalizeValue}，确保结果为 JSON-safe 的 Record。
 */
export function normalizeMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, string | number | boolean | null> {
  if (!metadata) {
    return {};
  }

  const result: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const normalized = normalizeValue(value);
    if (
      typeof normalized === "string" ||
      typeof normalized === "number" ||
      typeof normalized === "boolean" ||
      normalized === null
    ) {
      result[key] = normalized;
    } else if (Array.isArray(normalized)) {
      result[key] = JSON.stringify(normalized);
    } else {
      result[key] = String(normalized);
    }
  }

  return result;
}

/**
 * 合并两个 metadata 对象
 *
 * `override` 中的字段会覆盖 `base` 中的同名字段。
 * 最终结果会被规范化。
 */
export function mergeMetadata(
  base: Record<string, unknown> | undefined,
  override: Record<string, unknown> | undefined
): Record<string, string | number | boolean | null> {
  return normalizeMetadata({ ...base, ...override });
}
