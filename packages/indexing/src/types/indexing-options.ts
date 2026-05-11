import type { Document } from "./document.js";
import type { Chunk } from "@rag-sdk/core";
import type { IndexingContext } from "./indexing-context.js";
import type { Loader } from "../loaders/loader.js";
import type { DocumentTransformer } from "../transformers/document-transformer.js";
import type { Chunker } from "../chunkers/chunker.js";
import type { Embedder } from "../embedders/embedder.js";
import type { VectorStore } from "../stores/vector-store.js";

/**
 * 索引执行选项
 */
export type IndexingOptions = {
  loader: Loader;
  transformers?: DocumentTransformer[];
  chunker?: Chunker;
  embedder: Embedder;
  store: VectorStore;
  shouldIndex?: (doc: Document) => boolean | Promise<boolean>;
  metadataBuilder?: (
    doc: Document,
    chunk: Chunk
  ) => Record<string, string | number | boolean | null>;
  onError?: (
    error: Error,
    context: IndexingContext
  ) => void | Promise<void>;
  batchSize?: number;
};
