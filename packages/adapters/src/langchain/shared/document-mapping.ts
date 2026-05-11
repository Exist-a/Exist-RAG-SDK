import { Document as LCDocument } from "@langchain/core/documents";
import type { Document } from "@rag-sdk/indexing";
import { normalizeMetadata } from "../../shared/metadata.js";
import { generateFallbackId } from "./id-utils.js";

/**
 * 将 LangChain Document 转换为内部 Document
 */
export function fromLangChainDocument(lcDoc: LCDocument): Document {
  const id =
    (lcDoc.metadata?.id as string) ??
    (lcDoc.metadata?.source as string) ??
    generateFallbackId(lcDoc.pageContent);

  return {
    id,
    content: lcDoc.pageContent,
    metadata: normalizeMetadata(lcDoc.metadata),
  };
}

/**
 * 将内部 Document 转换为 LangChain Document
 */
export function toLangChainDocument(doc: Document): LCDocument {
  return new LCDocument({
    pageContent: doc.content,
    metadata: {
      ...doc.metadata,
      id: doc.id,
    },
  });
}
