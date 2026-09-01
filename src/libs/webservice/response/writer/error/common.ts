import { z } from "zod";

export type ErrorMessage = {
  error: string;
};

export const errorMessageSchema = z.object({
  error: z.string().min(1),
});
