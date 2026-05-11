import type { Chunk } from "@rag-sdk/core";
import type { Vector } from "../types/vector.js";
import type { Embedder } from "./embedder.js";

export type MockEmbedderOptions = {
  dimension?: number;
};

/**
 * Mock 嵌入器
 *
 * 返回固定维度的 mock 向量，用于 demo、测试和本地验证。
 */
export class MockEmbedder implements Embedder {
  private dimension: number;

  constructor(options: MockEmbedderOptions = {}) {
    this.dimension = options.dimension ?? 128;
  }

  async embed(chunks: Chunk[]): Promise<Vector[]> {
    return chunks.map((chunk) => ({
      id: chunk.id,
      values: new Array(this.dimension).fill(0),
      metadata: chunk.metadata,
    }));
  }
}
