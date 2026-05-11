import type { Chunk } from "@rag-sdk/core";
import type { Document } from "../types/document.js";
import type { Vector } from "../types/vector.js";
import type { IndexingResult } from "../types/indexing-result.js";
import type { IndexingOptions } from "../types/indexing-options.js";
import type { IndexingContext } from "../types/indexing-context.js";
import { SimpleChunker } from "../chunkers/simple-chunker.js";
import { IndexingError } from "../errors/index.js";
import { toError } from "@rag-sdk/utils";

/**
 * 统一索引执行入口
 *
 * 串行处理文档，按以下流程执行：
 * load → transform → filter → chunk → build metadata → embed → store → collect result
 */
export async function runIndexing(
  options: IndexingOptions
): Promise<IndexingResult> {
  const {
    loader,
    transformers,
    chunker = new SimpleChunker(),
    embedder,
    store,
    shouldIndex = () => true,
    metadataBuilder = (doc) => ({
      ...doc.metadata,
      documentId: doc.id,
    }),
    onError,
  } = options;

  const result: IndexingResult = {
    documentsTotal: 0,
    documentsIndexed: 0,
    chunksTotal: 0,
    vectorsTotal: 0,
    skippedDocuments: 0,
    failedDocuments: 0,
  };

  // Step 1: load
  const loadedDocs = await loader.load();
  result.documentsTotal = loadedDocs.length;

  // 逐个文档串行处理
  for (const doc of loadedDocs) {
    try {
      let currentDoc: Document = doc;

      // Step 2: transform（可选）
      if (transformers && transformers.length > 0) {
        for (const transformer of transformers) {
          currentDoc = await transformer.transform(currentDoc);
        }
      }

      // Step 3: filter（可选）
      const should = await shouldIndex(currentDoc);
      if (!should) {
        result.skippedDocuments++;
        continue;
      }

      // Step 4: chunk
      const chunks = await chunker.chunk(currentDoc);
      result.chunksTotal += chunks.length;

      // Step 5: build metadata（可选）
      const enrichedChunks: Chunk[] = chunks.map((chunk) => ({
        ...chunk,
        metadata: metadataBuilder(currentDoc, chunk),
      }));

      // Step 6: embed
      const vectors = await embedder.embed(enrichedChunks);
      result.vectorsTotal += vectors.length;

      // Step 7: store
      await store.upsert(vectors);

      result.documentsIndexed++;
    } catch (error) {
      result.failedDocuments++;

      const context: IndexingContext = {
        documentId: doc.id,
        stage: "store",
      };

      if (onError) {
        await onError(
          toError(error),
          context
        );
      } else {
        throw new IndexingError(
          `索引文档 "${doc.id}" 失败: ${error}`,
          context.stage
        );
      }
    }
  }

  return result;
}
