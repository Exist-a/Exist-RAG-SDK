# @rag-sdk/utils

RAG SDK 的通用工具函数库，提供跨包共享的纯工具函数。零外部依赖。

## 设计原则

- **零依赖**：不依赖 `@rag-sdk/core` 或其他任何包
- **纯函数**：无状态、无副作用
- **类型安全**：完整 TypeScript 类型定义

## 安装

```bash
# 作为其他包的依赖
pnpm --filter @rag-sdk/<pkg> add @rag-sdk/utils
```

## 主要导出

### 文本相似度

```typescript
import { jaccardSimilarity, ngramSet } from "@rag-sdk/utils";

// 计算两个字符串的 Jaccard 相似度（基于字符 2-gram）
const sim = jaccardSimilarity("hello world", "hello there");
// → 0~1 之间

// 生成 n-gram 集合
const bigrams = ngramSet("hello", 2);
// → Set { "he", "el", "ll", "lo" }
```

### ID 生成

```typescript
import { generateFallbackId, generateChunkId } from "@rag-sdk/utils";

// 基于内容的稳定 fallback ID（SHA-256 摘要）
const id = generateFallbackId("document content");
// → "a1b2c3d4..."（默认 16 位）

// 生成 chunk ID
const chunkId = generateChunkId("doc1", 3);
// → "doc1-chunk-3"
```

### Metadata 规范化

```typescript
import { normalizeValue, normalizeMetadata, mergeMetadata } from "@rag-sdk/utils";

// 将单个值规范化为 JSON-safe 类型
normalizeValue(new Date());           // → "2024-01-15T00:00:00.000Z"
normalizeValue(new URL("http://x"));  // → "http://x/"
normalizeValue(BigInt(100));          // → 100
normalizeValue([1, 2, 3]);            // → [1, 2, 3]
normalizeValue({ a: 1 });             // → '{"a":1}'

// 规范化整个 metadata 对象
const meta = normalizeMetadata({
  title: "文档",
  createdAt: new Date(),
  tags: ["a", "b"],
});

// 合并两个 metadata 对象（override 覆盖 base）
const merged = mergeMetadata({ a: "1" }, { a: "2", b: "3" });
// → { a: "2", b: "3" }
```

### 错误处理

```typescript
import { toError, getErrorMessage, getErrorCause } from "@rag-sdk/utils";

try {
  // ...
} catch (error) {
  const err = toError(error);          // Error 透传，非 Error 包装
  const msg = getErrorMessage(error);  // 安全获取消息
  const cause = getErrorCause(error);  // 获取 cause（非 Error 则 undefined）
}
```

### 格式化

```typescript
import { buildPromptContext } from "@rag-sdk/utils";

const context = buildPromptContext([
  { content: "片段1" },
  { content: "片段2" },
]);
// → "片段1\n\n片段2"

// 自定义分隔符
buildPromptContext([{ content: "a" }, { content: "b" }], " | ");
// → "a | b"
```

## 测试

```bash
pnpm --filter @rag-sdk/utils test
```
