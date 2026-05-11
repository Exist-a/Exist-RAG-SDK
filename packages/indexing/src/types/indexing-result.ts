/**
 * 索引执行结果
 */
export type IndexingResult = {
  documentsTotal: number;
  documentsIndexed: number;
  chunksTotal: number;
  vectorsTotal: number;
  skippedDocuments: number;
  failedDocuments: number;
};
