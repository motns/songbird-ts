import { z } from "zod";

export function isEmptySchema(schema: z.ZodObject): boolean {
  return Object.keys(schema.shape).length === 0;
}
