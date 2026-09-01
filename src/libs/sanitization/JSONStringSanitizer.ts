import { DataSanitizer } from "./DataSanitizer.js";
import type { DataSanitizationResult } from "../../types/sanitization.js";

export class JSONStringSanitizer extends DataSanitizer<string, unknown, "invalid_json"> {
  readonly codes = ["invalid_json" as const]

  override process(v: string): DataSanitizationResult<unknown> {
    try {
      return {
        isValid: true,
        data: JSON.parse(v)
      }
    } catch (e) {
      return {
        isValid: false,
        validationErrors: {
          errors: [{
            code: "invalid_json",
            message: `String is not valid JSON: ${e}`,
          }]
        },
      }
    }
  }
}

export const jsonStringSanitizer = new JSONStringSanitizer()