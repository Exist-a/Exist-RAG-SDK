import { z } from "zod";
import { QuerySchema } from "../spec/query.js";

/**
 * Query 类型
 */
export type Query = z.infer<typeof QuerySchema>;
