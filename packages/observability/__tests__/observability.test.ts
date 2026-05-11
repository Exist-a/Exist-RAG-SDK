import { test, expect, vi } from "vitest";
import {
  NoopObserver,
  createConsoleObserver,
  createRAGObserver,
  createMemoryTraceExporter,
  createConsoleExporter,
  createNoopExporter,
  applyRedaction,
  shouldSample,
  generateTraceId,
  safeErrorRecord,
  safeInvoke,
  nowISO,
} from "../src/index.js";
import type { RAGEvent, RAGTrace, RAGErrorRecord } from "../src/index.js";

// ========== NoopObserver ==========

test("NoopObserver 所有方法不抛错", async () => {
  await expect(NoopObserver.onEvent?.({} as RAGEvent)).resolves.toBeUndefined();
  await expect(NoopObserver.onError?.({} as RAGErrorRecord)).resolves.toBeUndefined();
  await expect(NoopObserver.onTraceEnd?.({} as RAGTrace)).resolves.toBeUndefined();
  await expect(NoopObserver.flush?.()).resolves.toBeUndefined();
  await expect(NoopObserver.shutdown?.()).resolves.toBeUndefined();
});

// ========== ConsoleObserver ==========

test("createConsoleObserver 能接收并输出 event", async () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const observer = createConsoleObserver({ level: "info" });

  const event: RAGEvent = {
    traceId: "t1",
    scope: "runtime",
    stage: "query",
    name: "runtime.query.receive",
    timestamp: nowISO(),
    durationMs: 10,
  };

  await observer.onEvent?.(event);
  expect(logSpy).toHaveBeenCalled();
  expect(logSpy.mock.calls[0][0]).toContain("runtime.query.receive");

  logSpy.mockRestore();
});

test("createConsoleObserver 根据 level 过滤", async () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const observer = createConsoleObserver({ level: "error" });

  const event: RAGEvent = {
    traceId: "t1",
    scope: "runtime",
    stage: "query",
    name: "runtime.query.receive",
    timestamp: nowISO(),
  };

  await observer.onEvent?.(event);
  expect(logSpy).not.toHaveBeenCalled();

  const errorRecord: RAGErrorRecord = {
    traceId: "t1",
    scope: "runtime",
    stage: "retrieval",
    name: "runtime.retrieval.fail",
    timestamp: nowISO(),
    error: { name: "Error", message: "fail" },
  };

  await observer.onError?.(errorRecord);
  expect(errorSpy).toHaveBeenCalled();

  logSpy.mockRestore();
  errorSpy.mockRestore();
});

// ========== RAGObserver (组合型) ==========

test("createRAGObserver 组合 exporter 并导出 trace", async () => {
  const memoryExporter = createMemoryTraceExporter();
  const observer = createRAGObserver({
    exporters: [memoryExporter],
  });

  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [
      {
        traceId: "t1",
        scope: "runtime",
        stage: "query",
        name: "runtime.query.receive",
        timestamp: nowISO(),
      },
    ],
  };

  await observer.onTraceEnd?.(trace);

  const traces = memoryExporter.getTraces();
  expect(traces).toHaveLength(1);
  expect(traces[0].traceId).toBe("t1");
});

test("createRAGObserver 内部错误不影响主流程", async () => {
  const badExporter = createNoopExporter();
  badExporter.export = async () => {
    throw new Error("export failed");
  };

  const observer = createRAGObserver({
    exporters: [badExporter],
  });

  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };

  // 不应抛错
  await expect(observer.onTraceEnd?.(trace)).resolves.toBeUndefined();
});

// ========== MemoryExporter ==========

test("createMemoryTraceExporter 能存储和读取 trace", () => {
  const exporter = createMemoryTraceExporter();

  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };

  exporter.export(trace);
  expect(exporter.getTraces()).toHaveLength(1);
  expect(exporter.getLastTrace()?.traceId).toBe("t1");

  exporter.clear();
  expect(exporter.getTraces()).toHaveLength(0);
});

// ========== Redaction ==========

test("applyRedaction 脱敏指定字段", () => {
  const result = applyRedaction(
    { user: "alice", email: "alice@example.com", age: 30 },
    { fields: ["email"], replacement: "[REDACTED]" }
  );

  expect(result.user).toBe("alice");
  expect(result.email).toBe("[REDACTED]");
  expect(result.age).toBe(30);
});

test("applyRedaction maskContent 对长 content 做 preview", () => {
  const longContent = "a".repeat(300);
  const result = applyRedaction(
    { content: longContent, title: "doc" },
    { maskContent: true, contentPreviewLength: 50, replacement: "[MASKED]" }
  );

  expect(typeof result.content).toBe("string");
  expect((result.content as string).length).toBeLessThan(longContent.length);
  expect((result.content as string)).toContain("[MASKED]");
  expect(result.title).toBe("doc");
});

test("applyRedaction 短 content 不被 mask", () => {
  const result = applyRedaction(
    { content: "short" },
    { maskContent: true, contentPreviewLength: 200 }
  );

  expect(result.content).toBe("short");
});

// ========== Sampling ==========

test("shouldSample rate=1 时全部采样", () => {
  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };
  expect(shouldSample(trace, { rate: 1 })).toBe(true);
});

test("shouldSample rate=0 时全部丢弃", () => {
  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };
  expect(shouldSample(trace, { rate: 0 })).toBe(false);
});

test("shouldSample alwaysSampleOnError=true 时错误 trace 强制保留", () => {
  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "error",
    events: [],
  };
  expect(shouldSample(trace, { rate: 0, alwaysSampleOnError: true })).toBe(true);
});

test("shouldSample 同一 traceId 采样结果稳定", () => {
  const trace: RAGTrace = {
    traceId: "stable-id-123",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };

  const result1 = shouldSample(trace, { rate: 0.5 });
  const result2 = shouldSample(trace, { rate: 0.5 });
  expect(result1).toBe(result2);
});

// ========== Utils ==========

test("generateTraceId 生成唯一 ID", () => {
  const id1 = generateTraceId();
  const id2 = generateTraceId();
  expect(id1).not.toBe(id2);
  expect(id1.length).toBeGreaterThan(0);
});

test("safeErrorRecord 处理 Error 实例", () => {
  const err = new Error("test error");
  const record = safeErrorRecord(err);
  expect(record.name).toBe("Error");
  expect(record.message).toBe("test error");
});

test("safeErrorRecord 处理非 Error", () => {
  const record = safeErrorRecord("string error");
  expect(record.name).toBe("UnknownError");
  expect(record.message).toBe("string error");
});

test("safeInvoke 不抛错并返回结果", async () => {
  const result = await safeInvoke(async () => 42);
  expect(result).toBe(42);
});

test("safeInvoke 失败时返回 undefined", async () => {
  const result = await safeInvoke(async () => {
    throw new Error("fail");
  });
  expect(result).toBeUndefined();
});

// ========== Event 命名规范 ==========

test("RuntimeEventName 符合 scope.stage.action 规范", () => {
  const validNames = [
    "runtime.query.receive",
    "runtime.retrieval.complete",
    "runtime.post_retrieval.select",
    "runtime.generation.fail",
  ];

  for (const name of validNames) {
    const parts = name.split(".");
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts[0]).toBe("runtime");
  }
});

test("IndexingEventName 符合 scope.stage.action 规范", () => {
  const validNames = [
    "indexing.run.start",
    "indexing.load.complete",
    "indexing.chunk.complete",
  ];

  for (const name of validNames) {
    const parts = name.split(".");
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts[0]).toBe("indexing");
  }
});

// ========== RAGAttributes 承载复杂数据 ==========

test("RAGAttributes 可承载 nested JSON 和 candidate array", () => {
  const attributes = {
    candidates: [
      { id: "c1", score: 0.82, metadata: { section: "leave" } },
    ],
    droppedReasons: {
      score_below_threshold: 3,
      near_duplicate: 2,
    },
  };

  expect(JSON.stringify(attributes)).toBeDefined();
  expect(JSON.parse(JSON.stringify(attributes)).candidates[0].id).toBe("c1");
});
