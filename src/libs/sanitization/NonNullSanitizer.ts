import { DataSanitizer } from "./DataSanitizer.js";
import type { DataSanitizationResult } from "../../types/sanitization.js";

export class NonNullSanitizer<T> extends DataSanitizer<T | null | undefined, T, "required"> {
  readonly codes = ["required" as const]

  process(v?: T | null | undefined): DataSanitizationResult<T> {
    if (!v) {
      return {
        isValid: false,
        validationErrors: {
          errors: [{
            code: "required",
            message: "Cannot be null",
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