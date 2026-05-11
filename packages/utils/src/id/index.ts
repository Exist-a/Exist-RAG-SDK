import { createHash } from "node:crypto";

/**
 * 基于内容生成稳定的 fallback ID
 *
 * 使用 SHA-256 对内容做摘要，取前 16 位十六进制字符。
 */
export function generateFallbackId(content: string, length: number = 16): string {
  return createHash("sha256").update(content).digest("hex").slice(0, length);
}

/**
 * 生成 chunk ID
 *
 * 格式：`<documentId>-chunk-<chunkIndex>`
 */
export function generateChunkId(documentId: string, chunkIndex: number): string {
  return `${documentId}-chunk-${chunkIndex}`;
}
