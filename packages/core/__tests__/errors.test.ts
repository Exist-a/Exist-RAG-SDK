import { test, expect } from "vitest";
import { ValidationError, RetrievalError, GenerationError } from "../src/index.js";

test("ValidationError 是 Error 实例并携带 message", () => {
  const err = new ValidationError("字段校验失败");
  expect(err).toBeInstanceOf(Error);
  expect(err).toBeInstanceOf(ValidationError);
  expect(err.message).toBe("字段校验失败");
  expect(err.name).toBe("ValidationError");
});

test("RetrievalError 是 Error 实例并携带 message", () => {
  const err = new RetrievalError("检索超时");
  expect(err).toBeInstanceOf(Error);
  expect(err).toBeInstanceOf(RetrievalError);
  expect(err.message).toBe("检索超时");
});

test("GenerationError 是 Error 实例并携带 message", () => {
  const err = new GenerationError("生成失败");
  expect(err).toBeInstanceOf(Error);
  expect(err).toBeInstanceOf(GenerationError);
  expect(err.message).toBe("生成失败");
});
