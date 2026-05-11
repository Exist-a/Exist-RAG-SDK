import { test, expect, vi } from "vitest";
import { ObservabilityError, safeInvokeSync } from "../src/index.js";

test("ObservabilityError 携带 message、stage 和 cause", () => {
  const cause = new Error("底层错误");
  const err = new ObservabilityError("导出失败", "export", cause);

  expect(err).toBeInstanceOf(Error);
  expect(err.message).toBe("导出失败");
  expect(err.stage).toBe("export");
  expect(err.cause).toBe(cause);
  expect(err.name).toBe("ObservabilityError");
});

test("ObservabilityError 无 cause 时 cause 为 undefined", () => {
  const err = new ObservabilityError("采样失败", "sampling");
  expect(err.cause).toBeUndefined();
});

test("safeInvokeSync 正常返回结果", () => {
  const result = safeInvokeSync(() => 42);
  expect(result).toBe(42);
});

test("safeInvokeSync 异常时返回 undefined 且不抛错", () => {
  const onError = vi.fn();
  const result = safeInvokeSync(() => {
    throw new Error("boom");
  }, onError);

  expect(result).toBeUndefined();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
});

test("safeInvokeSync 无 onError 时静默 swallow 异常", () => {
  const result = safeInvokeSync(() => {
    throw new Error("silent");
  });
  expect(result).toBeUndefined();
});
