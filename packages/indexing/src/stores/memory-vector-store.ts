import type { Vector } from "../types/vector.js";
import type { VectorStore } from "./vector-store.js";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 内存向量存储
 *
 * 以内存数组形式保存向量，用于 demo、本地调试和 smoke test。
 * 支持基于余弦相似度的 Top-K 检索。
 */
export class MemoryVectorStore implements VectorStore {
  private vectors: Vector[] = [];

  async upsert(vectors: Vector[]): Promise<void> {
    for (const vector of vectors) {
      const index = this.vectors.findIndex((v) => v.id === vector.id);
      if (index >= 0) {
        this.vectors[index] = vector;
      } else {
        this.vectors.push(vector);
      }
    }
  }

  /**
   * 获取所有已存储的向量
   */
  getAll(): Vector[] {
    return this.vectors;
  }

  /**
   * 清空存储
   */
  clear(): void {
    this.vectors = [];
  }

  /**
   * 基于余弦相似度的 Top-K 检索
   *
   * @param options.queryVector 查询向量
   * @param options.topK 返回的最大结果数
   * @param options.filter 可选的 metadata 等值过滤条件
   */
  async query(options: {
    queryVector: number[];
    topK: number;
    filter?: Record<string, unknown>;
  }): Promise<Vector[]> {
    let candidates = this.vectors;

    if (options.filter) {
      candidates = candidates.filter((v) => {
        if (!v.metadata) return false;
        return Object.entries(options.filter!).every(
          ([key, value]) => v.metadata![key] === value
        );
      });
    }

    const scored = candidates.map((v) => ({
      vector: v,
      score: cosineSimilarity(v.values, options.queryVector),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, options.topK).map((s) => s.vector);
  }
}
