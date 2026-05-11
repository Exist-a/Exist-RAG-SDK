/**
 * 采样配置选项
 */
export type SamplingOptions = {
  /** 采样率，0~1（默认 1） */
  rate?: number;
  /** 错误时是否强制采样（默认 true） */
  alwaysSampleOnError?: boolean;
};
