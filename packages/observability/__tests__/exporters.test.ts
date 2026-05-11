import { test, expect, vi } from "vitest";
import {
  createConsoleExporter,
  createMemoryTraceExporter,
  createNoopExporter,
  nowISO,
} from "../src/index.js";
import type { RAGTrace } from "../src/index.js";

test("createConsoleExporter pretty=true 输出带分隔符", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const exporter = createConsoleExporter({ pretty: true });

  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };

  exporter.export(trace);
  expect(logSpy).toHaveBeenCalled();
  expect(logSpy.mock.calls.some((call) => call[0]?.includes?.("RAG Trace"))).toBe(true);

  logSpy.mockRestore();
});

test("createConsoleExporter pretty=false 输出单行 JSON", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const exporter = createConsoleExporter({ pretty: false });

  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };

  exporter.export(trace);
  expect(logSpy).toHaveBeenCalledTimes(1);
  const output = logSpy.mock.calls[0][0];
  expect(typeof output).toBe("string");
  expect(JSON.parse(output).traceId).toBe("t1");

  logSpy.mockRestore();
});

test("createMemoryTraceExporter 存储、读取和清除 trace", () => {
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
  expect(exporter.getLastTrace()).toBeUndefined();
});

test("createNoopExporter 所有方法不抛错", () => {
  const exporter = createNoopExporter();
  const trace: RAGTrace = {
    traceId: "t1",
    scope: "runtime",
    startedAt: nowISO(),
    status: "ok",
    events: [],
  };

  expect(() => exporter.export(trace)).not.toThrow();
  expect(() => exporter.flush?.()).not.toThrow();
  expect(() => exporter.shutdown?.()).not.toThrow();
});
