import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { LangChainChunkerAdapter } from "./langchain-chunker-adapter.js";

export type RecursiveTextSplitterOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
};

/**
 * 递归字符切分预设
 */
export class RecursiveTextSplitter extends LangChainChunkerAdapter {
  constructor(options: RecursiveTextSplitterOptions = {}) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize ?? 500,
      chunkOverlap: options.chunkOverlap ?? 50,
    });

    super(splitter);
  }
}
