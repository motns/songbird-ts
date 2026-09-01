import { DataSanitizer } from "./DataSanitizer.js";
import type { DataSanitizationResult } from "../../types/sanitization.js";

export class StringSanitizer extends DataSanitizer<unknown, string, "not_string"> {
  readonly codes = ["not_string" as const]

  process(v: unknown): DataSanitizationResult<string> {
    if (typeof v !== "string") {
      return {
        isValid: false,
        validationErrors: {
          errors: [{
            code: "not_string",
            message: "Has to be a string",
          }]
        },
      }
    }

    return {
      isValid: true,
      data: v
    }
  }
}

export const stringSanitizer = new StringSanitizer()