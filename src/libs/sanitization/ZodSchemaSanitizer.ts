import * as z from "zod";
import { DataSanitizerAsync } from "./DataSanitizer.js";
import { omit, isEmpty } from "remeda";
import type { DataSanitizationResult } from "../../types/sanitization.js";
import type { ComplexTypeValidationErrors, ValidationError } from "../../types/validation.js";


export class ZodSchemaSanitizer<Output> extends DataSanitizerAsync<unknown, Output, z.core.$ZodIssueCode> {
  private readonly schema: z.ZodType<Output, unknown>
  // TODO - find a better way of getting these (v3 used to have a list, but v4 deprecated it)
  readonly codes = [
    "invalid_type",
    "too_big",
    "too_small",
    "invalid_format",
    "not_multiple_of",
    "unrecognized_keys",
    "invalid_union",
    "invalid_key",
    "invalid_element",
    "invalid_value",
    "custom",
  ] satisfies readonly z.core.$ZodIssueCode[]

  constructor(s: z.ZodType<Output, unknown>) {
    super();
    this.schema = s
  }

  override async process(v: unknown): Promise<DataSanitizationResult<Output>> {
    const res = await this.schema.safeParseAsync(v)

    if (res.success) {
      return {
        isValid: true,
        data: res.data
      }
    } else {
      return {
        isValid: false,
        validationErrors: this.zodErrorToFailedValidators(res.error),
      }
    }
  }

  private zodErrorToFailedValidators(zodError: z.ZodError): ComplexTypeValidationErrors {
    const validationErrors: ComplexTypeValidationErrors = {};

    for (const issue of zodError.issues) {
      const errorObj = this.zodIssueToFailedValidator(issue);
      if (issue.path.length === 0) {
        validationErrors.errors ||= [];
        validationErrors.errors.push(errorObj);
      } else {
        this.addIssueToNestedStructure(validationErrors, issue.path, errorObj);
      }
    }
    return validationErrors;
  }

  private addIssueToNestedStructure(
    validationErrors: ComplexTypeValidationErrors,
    path: PropertyKey[],
    errorObj: ValidationError
  ) {
    let current = validationErrors;
    for (const segment of path) {
      // Only handle string and number segments; skip symbols
      if (typeof segment === "number") {
        current.items ||= {};
        current.items[segment] ||= {};
        current = current.items[segment];
      } else if (typeof segment === "string") {
        current.properties ||= {};
        current.properties[segment] ||= {};
        current = current.properties[segment];
      } // symbols are ignored for nesting
    }
    current.errors ||= [];
    current.errors.push(errorObj);
  }

  private zodIssueToFailedValidator(issue: z.core.$ZodIssue): ValidationError {
    if (issue.code === "custom") {
      return {
        code: issue.code,
        message: issue.message,
        params: issue.params,
      }
    } else {
      const issueParams = omit(issue, ["code", "message", "path"])

      if (!isEmpty(issueParams)) {
        return {
          code: issue.code,
          message: issue.message,
          params: issueParams,
        }
      } else {
        return {
          code: issue.code,
          message: issue.message,
        }
      }
    }
  }
}
