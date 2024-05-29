import { DataSanitiser } from "./DataSanitiser";
import { DataSanitizationResult } from "../../types/sanitization";

export class JSONStringSanitiser extends DataSanitiser<string, unknown> {
  readonly codes = {
    invalid_json: "invalid_json",
  }

  process(v: string): DataSanitizationResult<unknown> {
    try {
      return JSON.parse(v)
    } catch (e) {
      return {
        isValid: false,
        validationErrors: {
          global: [{
            code: this.codes.invalid_json,
            message: "String is not valid JSON",
          }]
        },
      }
    }
  }
}

export const jsonStringSanitiser = new JSONStringSanitiser()