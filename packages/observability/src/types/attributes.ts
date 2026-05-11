// 复用 core 的 JsonValue 语义
// 由于 core 与 observability 的 tsconfig 模块解析路径差异，
// 此处直接内联 JsonValue 定义以保持类型一致性。
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

// 如果 core 已导出 JsonValue，后续可切换为：
// import type { JsonValue } from "@rag-sdk/core";

/**
 * RAG 事件属性
 *
 * 复用 core 的 JsonValue 语义，确保可序列化。
 */
export type RAGAttributes = Record<string, JsonValue>;
