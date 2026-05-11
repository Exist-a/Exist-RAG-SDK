import { ChromaClient, Collection } from "chromadb";
import type { Vector } from "@rag-sdk/indexing";
import type { VectorStore } from "@rag-sdk/indexing";
import { toChromaMetadata } from "../../shared/metadata.js";

export type ChromaVectorStoreOptions = {
  client?: ChromaClient;
  url?: string;
  collectionName: string;
  collectionMetadata?: Record<string, unknown>;
  collectionConfiguration?: Record<string, unknown>;
};

/**
 * Chroma 向量存储适配器
 *
 * 将 ChromaClient 收敛为 VectorStore 接口。
 */
export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collectionName: string;
  private collectionMetadata?: Record<string, unknown>;
  private collectionConfiguration?: Record<string, unknown>;
  private collection: Collection | null = null;

  constructor(options: ChromaVectorStoreOptions) {
    this.client = options.client ?? new ChromaClient({ path: options.url });
    this.collectionName = options.collectionName;
    this.collectionMetadata = options.collectionMetadata;
    this.collectionConfiguration = options.collectionConfiguration;
  }

  private async getCollection(): Promise<Collection> {
    if (this.collection) {
      return this.collection;
    }

    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: this.collectionMetadata as import("chromadb").CollectionMetadata,
        ...(this.collectionConfiguration
          ? { configuration: this.collectionConfiguration }
          : {}),
      });
      return this.collection;
    } catch (error) {
      throw new Error(
        `获取或创建 Chroma collection "${this.collectionName}" 失败: ${error}`
      );
    }
  }

  async upsert(vectors: Vector[]): Promise<void> {
    if (vectors.length === 0) {
      return;
    }

    // 校验维度一致
    const dimension = vectors[0].values.length;
    const inconsistent = vectors.find((v) => v.values.length !== dimension);
    if (inconsistent) {
      throw new Error(
        `向量维度不一致: 期望 ${dimension} 维，但向量 "${inconsistent.id}" 为 ${inconsistent.values.length} 维`
      );
    }

    const collection = await this.getCollection();

    const ids = vectors.map((v) => v.id);
    const embeddings = vectors.map((v) => v.values);
    const metadatas = vectors.map((v) => toChromaMetadata(v.metadata));

    await collection.upsert({
      ids,
      embeddings,
      metadatas: metadatas.some((m) => m !== undefined)
        ? (metadatas.filter((m) => m !== undefined) as import("chromadb").Metadata[])
        : undefined,
    });
  }
}
