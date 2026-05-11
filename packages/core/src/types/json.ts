/**
 * JSON 原始值类型
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * JSON 值类型
 *
 * 可递归表达任意 JSON-safe 数据结构。
 */
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
