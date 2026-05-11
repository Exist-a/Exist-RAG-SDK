import { TextSplitter } from "@langchain/textsplitters";
import type { Document } from "@rag-sdk/indexing";
import type { Chunk } from "@rag-sdk/core";
import type { Chunker } from "@rag-sdk/indexing";
import { toLangChainDocument, fromLangChainChunks } from "../shared/index.js";

/**
 * LangChain 切分器通用适配器
 *
 * 接收任意 LangChain TextSplitter，输出内部 Chunk[]。
 */
export class LangChainChunkerAdapter implements Chunker {
  private splitter: TextSplitter;

  constructor(splitter: TextSplitter) {
    this.splitter = splitter;
  }

  async chunk(doc: Document): Promise<Chunk[]> {
    const lcDoc = toLangChainDocument(doc);
    const lcChunks = await this.splitter.splitDocuments([lcDoc]);
    return fromLangChainChunks(lcChunks, doc);
  }
}
