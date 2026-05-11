import { z } from "zod";
import { RAGResponseSchema } from "../spec/rag-response.js";

/**
 * RAGResponse 类型
 */
export type RAGResponse = z.infer<typeof RAGResponseSchema>;
