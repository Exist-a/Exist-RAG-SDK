import type { Document } from "../types/document.js";
import type { Chunk } from "@rag-sdk/core";

/**
 * 切分器接口
 */
export interface Chunker {
  chunk(doc: Document): Promise<Chunk[]>;
}
