import { Embeddings } from "@langchain/core/embeddings";
import type { Chunk } from "@rag-sdk/core";
import type { Vector } from "@rag-sdk/indexing";
import type { Embedder } from "@rag-sdk/indexing";

/**
 * LangChain 嵌入器通用适配器
 *
 * 接收任意 LangChain Embeddings 实现，输出内部 Vector[]。
 */
export class LangChainEmbedderAdapter implements Embedder {
  private embeddings: Embeddings;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
  }

  async embed(chunks: Chunk[]): Promise<Vector[]> {
    if (chunks.length === 0) {
      return [];
    }

    const texts = chunks.map((chunk) => chunk.content);
    const vectors = await this.embeddings.embedDocuments(texts);

    if (vectors.length !== chunks.length) {
      throw new Error(
        `向量数量不匹配: 期望 ${chunks.length} 个，实际得到 ${vectors.length} 个`
      );
    }

    return chunks.map((chunk, index) => ({
      id: chunk.id,
      values: vectors[index],
      metadata: chunk.metadata,
    }));
  }
}
