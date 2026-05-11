export {
  normalizeValue,
  normalizeMetadata,
  mergeMetadata,
  type JsonSafeValue,
} from "@rag-sdk/utils";

/**
 * 将 metadata 转换为 Chroma 兼容格式
 *
 * Chroma 兼容规则：
 * 1. string / number / boolean / null 可直接保留
 * 2. 纯 string[] / number[] / boolean[] 可直接保留
 * 3. 混合数组必须序列化
 * 4. object 必须序列化
 * 5. metadata 为空时不强制传入 metadatas
 */
export function toChromaMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, string | number | boolean | null | string[] | number[] | boolean[]> | undefined {
  if (!metadata || Object.keys(metadata).length === 0) {
    return undefined;
  }

  const result: Record<string, string | number | boolean | null | string[] | number[] | boolean[]> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      result[key] = null;
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        result[key] = [];
        continue;
      }

      const firstType = typeof value[0];
      const isHomogeneous = value.every((v) => typeof v === firstType);

      if (isHomogeneous && ["string", "number", "boolean"].includes(firstType)) {
        result[key] = value as string[] | number[] | boolean[];
        continue;
      }

      result[key] = JSON.stringify(value);
      continue;
    }

    result[key] = JSON.stringify(value);
  }

  return result;
}
