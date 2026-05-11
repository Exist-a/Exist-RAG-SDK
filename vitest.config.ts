import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@rag-sdk/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@rag-sdk/indexing': resolve(__dirname, 'packages/indexing/src/index.ts'),
      '@rag-sdk/runtime': resolve(__dirname, 'packages/runtime/src/index.ts'),
      '@rag-sdk/adapters': resolve(__dirname, 'packages/adapters/src/index.ts'),
      '@rag-sdk/observability': resolve(__dirname, 'packages/observability/src/index.ts'),
      '@rag-sdk/utils': resolve(__dirname, 'packages/utils/src/index.ts'),
    },
  },
  test: {
    // 扫描所有子包的 __tests__ 目录以及根目录的 tests 目录
    include: [
      'packages/**/__tests__/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    globals: true,
    environment: 'node',
  },
});
