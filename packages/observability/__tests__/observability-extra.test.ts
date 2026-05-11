import { test, expect, vi } from "vitest";
import {
  createRAGObserver,
  createMemoryTraceExporter,
  applyRedaction,
  nowISO,
} from "../src/index.js";
import type { RAGTrace } from "../src/index.js";

test("applyRedaction 嵌套对象点路径字段脱敏", () => {
  const result = applyRedaction(
    {
      user: { name: "alice", email: "alice@example.com" },
      age: 30,
    },
    { fields: ["user.email"], replacement: "[REDACTED]" }
  );

  expect((result.user as Record<string, unknown>).name).toBe("alice");
  expect((result.user as Record<string, unknown>).email).toBe("[REDACTED]");
  expect(result.age).toBe(30);
});

test("createRAGObserver flush 时 exporter 出错被安全捕获", async () => {
  const badExporter = createMemoryTraceExporter();
  badExporter.flush = async () => {
    throw new Error("flush failed");
  };

  const observer = createRAGObserver({
    exporters: [badExporter],
  });

  await expect(observer.flush?.()).resolves.toBeUndefined();
});

test("createRAGObserver shutdown 时 exporter 出错被安全捕获", async () => {
  const badExporter = createMemoryTraceExporter();
  badExporter.shutdown = async () => {
    throw new Error("shutdown failed");
  };

  const observer = createRAGObserver({
    exporters: [badExporter],
  });

  await expect(observer.shutdown?.()).resolves.toBeUndefined();
});

test("createRAGObserver onTraceEnd 时 exporter export 出错被安全捕获", async () => {
  const badExporter = createMemoryTraceExporter();
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

  await expect(observer.onTraceEnd?.(trace)).resolves.toBeUndefined();
});
