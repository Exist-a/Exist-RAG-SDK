import { Document as LCDocument } from "@langchain/core/documents";
import type { Chunk } from "@rag-sdk/core";
import type { Document } from "@rag-sdk/indexing";
import { normalizeMetadata } from "../../shared/metadata.js";
import { generateChunkId } from "./id-utils.js";

/**
 * 将 LangChain 切分结果映射为内部 Chunk[]
 *
 * 自动补齐 sourceDocumentId 和 chunkIndex
 */
export function fromLangChainChunks(
  lcDocs: LCDocument[],
  sourceDocument: Document
): Chunk[] {
  return lcDocs
    .map((lcDoc, index) => {
      const content = lcDoc.pageContent.trim();
      if (content.length === 0) {
        return null;
      }

      const chunk: Chunk = {
        id: generateChunkId(sourceDocument.id, index),
        content,
        metadata: normalizeMetadata({
          ...sourceDocument.metadata,
          ...lcDoc.metadata,
          sourceDocumentId: sourceDocument.id,
          chunkIndex: index,
        }),
      };
      return chunk;
    })
    .filter((chunk): chunk is Chunk => chunk !== null);
}
