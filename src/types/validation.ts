import { z } from "zod";

/**
 * Used to represent a failure when performing a specific validation.
 * Validators should expose a list of possible error codes to serve as documentation for consumers.
 *
 * @property {string} code An error code for the validation failure, used mainly for machine processing of this error
 * @property {string} message Friendly error message, used mainly for human consumption
 * @property {Record<string, unknown>} params Optional data on the validation failure, used to expose any parameters that were
 *                                     used to validate (for example string format, or length limit) in a more structured
 *                                     format for machine processing.
 * @example
 * {
 *   code: "too_short",
 *   message: "has to be 5 characters of more",
 *   params: {
 *     length: 10
 *   }
 * }
 */
export const validationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  params: z.record(z.unknown()).optional()
})
export type ValidationError = z.infer<typeof validationErrorSchema>

/**
 * Used to represent a collection of validation errors which apply to either a simple or a complex type, in a format which
 * is machine friendly.
 * The `attribute` level errors only apply if we're validating an Object and there are attribute-specific errors.
 * The `global` errors apply to simple type validation errors, or Object validation errors which involve multiple attributes.
 * Either `attribute` or `global` must be filled in.
 *
 * @property {Record<string, ValidationError[]>} attribute Record containing validation errors by attribute path in `jq` format
 * @property {ValidationError[]} global List of validation errors which aren't specific to a single attribute
 * @example <caption>Validation errors for object type</caption>
 * {
 *   attribute: {
 *     "username": [{
 *       code: "too_short",
 *       message: "has to be 5 characters of more",
 *       params: {
 *         length: 10
 *       }
 *     }],
 *     "addresses[1].postcode": [{
 *       code: "invalid_format",
 *       message: "has to be valid postcode",
 *       params: {
 *         format: "postcode"
 *       }
 *     }]
 *   },
 *   global: [{
 *     code: "missing_address",
 *     message: "both shipping and billing address must be provided"
 *   }]
 * }
 * @example <caption>Validation errors for simple type</caption>
 * {
 *   global: [{
 *     code: "too_small",
 *     message: "has to be 100 or more",
 *     params: {
 *       minimum: 100
 *     }
 *   }]
 * }
 */
export const complexTypeValidationErrorsSchema = z.object({
  attribute: z.record(z.array(validationErrorSchema)).optional(),
  global: z.array(validationErrorSchema).optional(),
})
export type ComplexTypeValidationErrors = z.infer<typeof complexTypeValidationErrorsSchema>

/**
 * Base type for validation results. Instead of using this directly, use one of the concrete types below instead.
 *
 * @property {boolean} isValid Whether the validation was successful or not
 */
export type ValidationResult = {
  readonly isValid: boolean,
}

/**
 * Returned by Validators to indicate that data has passed validation
 */
export type ValidationSuccess = ValidationResult & {
  readonly isValid: true,
}

/**
 * Returned by Validators to indicate that data has failed validation
 */
export type ComplexTypeValidationFailure = ValidationResult & {
  readonly isValid: false,
  readonly validationErrors: ComplexTypeValidationErrors,
}

/**
 * Union type for representing Validator results
 */
export type ComplexValidationResult = ValidationSuccess | ComplexTypeValidationFailure

/**
 * Used to represent a function for performing additional validations on a Request,
 * not covered by the initial validation/sanitization phase.
 */
export type RequestValidatorFunction<
  PathParams,
  QueryParams,
  Headers,
  RequestBody,
> = (
  pathParams: PathParams,
  queryParams: QueryParams,
  headers: Headers,
  requestBody: RequestBody,
) => Promise<ComplexValidationResult>