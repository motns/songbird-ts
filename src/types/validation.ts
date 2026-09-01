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
  params: z.record(z.string(), z.unknown()).optional(),
});
export type ValidationError = z.infer<typeof validationErrorSchema>;

/**
 * Used to represent a collection of validation errors which apply to either a simple or a complex type, in a format which
 * is machine-friendly.
 * The naming and format mirror closely what's returned by Zod4's new `z.treeifyError()` method, with the main difference
 * being that instead of returning just an error string for each failure, we return a complex object type - see `ValidationError`.
 * Either `attribute`, `items` or `global` must be filled in.
 *
 * @property {Record<string, ComplexTypeValidationErrors>} properties Only applies if we're returning errors for an Object.
 *                                                                    Contains potentially nested validation errors for object properties.
 * @property {Record<number, ComplexTypeValidationErrors>} items Only applies if we're returning errors for an Array.
 *                                                               Record containing potentially nested validation errors for array items,
 *                                                               keyed by element index.
 * @property {ValidationError[]} errors List of validation errors which apply at the current level. Simple types would
 *                                      only have `errors`, and no `properties` or `items` key.
 *                                      This is also where validation errors which apply to multiple keys or array
 *                                      elements would appear.
 * @example <caption>Validation errors for nested object type</caption>
 * {
 *   properties: {
 *     username: {
 *       errors: [{
 *         code: "too_short",
 *         message: "has to be 5 characters of more",
 *         params: {
 *           length: 5
 *         }
 *       }]
 *     },
 *     addresses: {
 *       items: {
 *         1: {
 *           properties: {
 *             postcode: {
 *               errors: [{
 *                 code: "invalid_format",
 *                 message: "has to be valid postcode",
 *                 params: {
 *                   format: "postcode"
 *                 }
 *               }]
 *             }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   errors: [{
 *     code: "missing_address",
 *     message: "both shipping and billing address must be provided"
 *   }]
 * }
 * @example <caption>Validation errors for simple type</caption>
 * {
 *   errors: [{
 *     code: "too_small",
 *     message: "has to be 100 or more",
 *     params: {
 *       minimum: 100
 *     }
 *   }]
 * }
 */
export const complexTypeValidationErrorsSchema = z
  .object({
    get properties() {
      return z.record(z.string(), complexTypeValidationErrorsSchema).optional();
    },
    get items() {
      return z.record(z.number(), complexTypeValidationErrorsSchema).optional();
    },
    errors: z.array(validationErrorSchema).optional(),
  })
  // This schema is self-referential (see `properties`/`items` above). Without a stable ref ID here,
  // zod-to-openapi has no way to detect the cycle and recurses into it forever while generating the
  // OpenAPI document, overflowing the call stack.
  .meta({ id: "ComplexTypeValidationErrors" });
export type ComplexTypeValidationErrors = z.infer<typeof complexTypeValidationErrorsSchema>;

/**
 * Base type for validation results. Instead of using this directly, use one of the concrete types below instead.
 *
 * @property {boolean} isValid Whether the validation was successful or not
 */
export type ValidationResult = {
  readonly isValid: boolean;
};

/**
 * Returned by Validators to indicate that data has passed validation
 */
export type ValidationSuccess = ValidationResult & {
  readonly isValid: true;
};

/**
 * Returned by Validators to indicate that data has failed validation
 */
export type ComplexTypeValidationFailure = ValidationResult & {
  readonly isValid: false;
  readonly validationErrors: ComplexTypeValidationErrors;
};

/**
 * Union type for representing Validator results
 */
export type ComplexValidationResult = ValidationSuccess | ComplexTypeValidationFailure;

/**
 * Used to represent a function for performing additional validations on a Request,
 * not covered by the initial validation/sanitization phase.
 */
export type RequestValidatorFunction<PathParams, QueryParams, Headers, RequestBody> = (
  pathParams: PathParams,
  queryParams: QueryParams,
  headers: Headers,
  requestBody: RequestBody,
) => Promise<ComplexValidationResult>;
