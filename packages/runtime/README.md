# @rag-sdk/runtime

RAG SDK 的在线查询运行时，提供四阶段流水线编排和检索后处理策略。

## 安装

```bash
pnpm --filter @rag-sdk/runtime add @rag-sdk/core
```

## 主要导出

### Pipeline

- `createRuntime()` — 自定义四阶段运行时工厂
- `createDefaultRuntime()` — 默认运行时工厂
- `runPipeline()` — 流水线执行器

### 阶段接口

- `QueryPreprocessor` — 查询预处理接口
- `RuntimeRetriever` — 检索器接口
- `RetrievalPostprocessor` — 检索后处理接口
- `RuntimeGenerator` — 生成器接口

### 检索后处理策略

- `createDefaultPostprocessor()` — 可配置默认后处理器
- `applyScoreThreshold()` — 分数阈值过滤
- `applyBudgetTrim()` — 预算裁剪
- `applyCustomPredicate()` — 自定义谓词过滤
- `applyNearDuplicateRemoval()` — 近似去重
- `applySourceCoverage()` — 来源覆盖率限制
- `orderCandidates()` — 候选排序

### 错误

- `RuntimeError` — 带阶段语义的运行时错误

## 快速示例

### 最小示例

```typescript
import { createDefaultRuntime } from "@rag-sdk/runtime";

const runtime = createDefaultRuntime({
  retriever: {
    async retrieve(query) {
      return {
        chunks: [
          { id: "c1", content: `关于 "${query.query}" 的片段` },
        ],
      };
    },
  },
  generator: {
    async generate({ query, chunks }) {
      return { answer: `基于 ${chunks.length} 个片段的回答` };
    },
  },
});

const result = await runtime.run({ query: { query: "RAG 是什么" } });
```

### 使用检索后处理策略

```typescript
import { createDefaultRuntime, createDefaultPostprocessor } from "@rag-sdk/runtime";

const runtime = createDefaultRuntime({
  retriever: /* ... */,
  generator: /* ... */,
  postprocessor: createDefaultPostprocessor({
    scoreThreshold: 0.5,
    budget: { maxCandidates: 5 },
    nearDuplicate: true,
    sourceCoverage: { maxPerSource: 2 },
    orderBy: "score",
    debug: true,
  }),
});
```

## 测试

```bash
pnpm --filter @rag-sdk/runtime test
```

## 详细文档

详见 `docs/sdk/runtime使用指南.md`
