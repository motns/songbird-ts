import { z, ZodError, ZodIssue, ZodIssueCode, ZodType } from "zod";
import { DataSanitiserAsync } from "./DataSanitiser";
import _ from "lodash";
import { DataSanitizationResult } from "../../types/sanitization";
import { ComplexTypeValidationErrors, ValidationError } from "../../types/validation";

export class ZodSchemaSanitizer<Schema extends ZodType> extends DataSanitiserAsync<any, z.infer<Schema>> {
  // Take ZodIssue codes directly from library, but add our own custom "missing_attribute" type
  readonly codes = _.merge(ZodIssueCode, { missing_attribute: "missing_attribute" })
  private readonly schema: Schema

  constructor(s: Schema) {
    super();
    this.schema = s
  }

  async process(v: any): Promise<DataSanitizationResult<z.infer<Schema>>> {
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

  private zodErrorToFailedValidators(zodError: ZodError): ComplexTypeValidationErrors {
    const failuresByAttribute: Record<string, ValidationError[]> = {}
    const globalFailures: ValidationError[] = []

    zodError.issues.forEach((issue: ZodIssue) => {
      if (issue.path.length === 0) { // Errors without a path should go in document scope
        globalFailures.push(this.zodIssueToFailedValidator(issue))
      } else {
        const pathStr = this.zodPathArrayToString(issue.path)
        failuresByAttribute[pathStr] ||= []
        failuresByAttribute[pathStr].push(this.zodIssueToFailedValidator(issue))
      }
    })

    return {
      attribute: failuresByAttribute,
      global: globalFailures
    }
  }

  private zodIssueToFailedValidator(issue: ZodIssue): ValidationError {
    if (issue.code === ZodIssueCode.custom) {
      return {
        code: issue.code,
        message: issue.message,
        params: issue.params,
      }
    } else {
      // Zod considers missing attributes to be type errors, so we'll convert them to our own code for clarity
      if (issue.code === ZodIssueCode.invalid_type && issue.message === "Required") {
        return {
          code: this.codes.missing_attribute,
          message: issue.message,
        }
      } else {
        const issueParams = _.omit(issue, ["code", "message"])

        if (!_.isEmpty(issueParams)) {
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

  private zodPathArrayToString(pathArray: (string | number)[]): string {
    let out = ""

    pathArray.forEach((curr: string | number) => {
      if (typeof curr === "number") {
        out = out + `[${curr}]`
      } else {
        out = out + "." + curr
      }
    })

    return out
  }
}