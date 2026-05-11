import { TokenTextSplitter } from "@langchain/textsplitters";
import { LangChainChunkerAdapter } from "./langchain-chunker-adapter.js";

export type TokenTextSplitterOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
};

/**
 * Token 切分预设
 */
export class TokenTextSplitterPreset extends LangChainChunkerAdapter {
  constructor(options: TokenTextSplitterOptions = {}) {
    const splitter = new TokenTextSplitter({
      chunkSize: options.chunkSize ?? 500,
      chunkOverlap: options.chunkOverlap ?? 50,
    });

    super(splitter);
  }
}
