import {
  createRAGObserver,
  createConsoleExporter,
  createMemoryTraceExporter,
  NoopObserver,
  generateTraceId,
  nowISO,
} from "../src/index.js";
import type { RAGEvent, RAGTrace, RAGErrorRecord } from "../src/index.js";

async function main() {
  console.log("=== Observability 演示 ===\n");

  // 1. 创建内存 exporter（用于后续读取）
  const memoryExporter = createMemoryTraceExporter();

  // 2. 创建组合型 observer
  const observer = createRAGObserver({
    exporters: [
      createConsoleExporter({ pretty: false }), // 简洁输出到控制台
      memoryExporter,
    ],
    redaction: {
      fields: ["user.email"],
      maskContent: true,
      contentPreviewLength: 100,
    },
    sampling: {
      rate: 1,
      alwaysSampleOnError: true,
    },
  });

  // 3. 模拟 runtime 事件流
  const traceId = generateTraceId();

  const events: RAGEvent[] = [
    {
      traceId,
      scope: "runtime",
      stage: "query",
      name: "runtime.query.receive",
      timestamp: nowISO(),
      attributes: {
        query: "公司年假政策是什么？",
        user: { id: "u001", email: "alice@company.com" },
      },
    },
    {
      traceId,
      scope: "runtime",
      stage: "query",
      name: "runtime.query.preprocess",
      timestamp: nowISO(),
      durationMs: 12,
      attributes: {
        effectiveQuery: "公司年假政策",
        rewriteApplied: false,
      },
    },
    {
      traceId,
      scope: "runtime",
      stage: "retrieval",
      name: "runtime.retrieval.complete",
      timestamp: nowISO(),
      durationMs: 145,
      attributes: {
        candidateCount: 8,
        topK: 10,
        candidates: [
          { id: "doc1-chunk-0", score: 0.92, source: "handbook" },
          { id: "doc1-chunk-1", score: 0.88, source: "handbook" },
        ],
      },
    },
    {
      traceId,
      scope: "runtime",
      stage: "post_retrieval",
      name: "runtime.post_retrieval.select",
      timestamp: nowISO(),
      durationMs: 23,
      attributes: {
        inputCandidateCount: 8,
        selected: 4,
        dropped: 4,
        droppedReasons: {
          score_below_threshold: 2,
          near_duplicate: 1,
          budget_exceeded: 1,
        },
        selectedChunkIds: ["doc1-chunk-0", "doc1-chunk-1", "doc2-chunk-0", "doc3-chunk-0"],
      },
    },
    {
      traceId,
      scope: "runtime",
      stage: "generation",
      name: "runtime.generation.complete",
      timestamp: nowISO(),
      durationMs: 1240,
      attributes: {
        model: "gpt-4",
        promptTokens: 1200,
        completionTokens: 180,
        totalTokens: 1380,
        answerPreview: "根据公司《员工手册》第 3 章规定...",
      },
    },
  ];

  for (const event of events) {
    await observer.onEvent?.(event);
  }

  // 4. 构造并结束 trace
  const trace: RAGTrace = {
    traceId,
    scope: "runtime",
    startedAt: events[0].timestamp,
    endedAt: nowISO(),
    durationMs: 1420,
    status: "ok",
    tags: { app: "internal-kb", channel: "web" },
    events,
  };

  await observer.onTraceEnd?.(trace);

  // 5. 从 memory exporter 读取结果
  console.log("\n=== Memory Exporter 中的 Trace 摘要 ===");
  const storedTraces = memoryExporter.getTraces();
  console.log(`存储的 trace 数量: ${storedTraces.length}`);

  const lastTrace = storedTraces[0];
  console.log(`Trace ID: ${lastTrace.traceId}`);
  console.log(`状态: ${lastTrace.status}`);
  console.log(`耗时: ${lastTrace.durationMs}ms`);
  console.log(`事件数: ${lastTrace.events.length}`);
  console.log(`Tags: ${JSON.stringify(lastTrace.tags)}`);

  // 6. 验证脱敏效果
  const queryEvent = lastTrace.events.find((e) => e.name === "runtime.query.receive");
  console.log(`\n脱敏检查:`);
  const userAttr = queryEvent?.attributes?.user as Record<string, unknown> | undefined;
  console.log(`  user.email 是否被脱敏: ${userAttr?.email === "[REDACTED]"}`);

  // 7. 演示 NoopObserver（无观测）
  console.log("\n=== NoopObserver（无观测开销）===");
  const noop = NoopObserver;
  await noop.onEvent?.(events[0]);
  console.log("NoopObserver 已处理事件（无输出）");

  console.log("\n=== 演示完成 ===");
}

main().catch(console.error);
