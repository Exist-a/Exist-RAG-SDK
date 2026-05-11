import type { Document } from "../types/document.js";
import type { Chunk } from "@rag-sdk/core";
import type { Chunker } from "./chunker.js";
import { DEFAULT_CHUNK_SIZE, DEFAULT_OVERLAP } from "../defaults/index.js";
import { generateChunkId } from "@rag-sdk/utils";

export type SimpleChunkerOptions = {
  chunkSize?: number;
  overlap?: number;
};

/**
 * 简单切分器
 *
 * 按固定长度切分文档，支持重叠。
 */
export class SimpleChunker implements Chunker {
  private chunkSize: number;
  private overlap: number;

  constructor(options: SimpleChunkerOptions = {}) {
    this.chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    this.overlap = options.overlap ?? DEFAULT_OVERLAP;
  }

  async chunk(doc: Document): Promise<Chunk[]> {
    const { id, content } = doc;
    const chunks: Chunk[] = [];
    const step = this.chunkSize - this.overlap;

    for (let i = 0; i < content.length; i += step) {
      const slice = content.slice(i, i + this.chunkSize);
      if (slice.trim().length === 0) continue;

      chunks.push({
        id: generateChunkId(id, chunks.length),
        content: slice,
      });
    }

    return chunks;
  }
}
