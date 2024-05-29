import { DataSanitiser } from "./DataSanitiser";
import { DataSanitizationResult } from "../../types/sanitization";

export class NonNullSanitiser<T> extends DataSanitiser<T | null | undefined, T> {
  readonly codes = {
    required: "required",
  }

  process(v?: T | null): DataSanitizationResult<T> {
    if (!v) {
      return {
        isValid: false,
        validationErrors: {
          global: [{
            code: this.codes.required,
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