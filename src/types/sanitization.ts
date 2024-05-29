import {
  complexTypeValidationErrorsSchema,
  ComplexTypeValidationFailure,
  ValidationResult
} from "./validation";
import { z } from "zod";

export type DataSanitizationSuccess<Out> = ValidationResult & {
  isValid: true,
  data: Out,
}

export type DataSanitizationResult<Out> = DataSanitizationSuccess<Out> | ComplexTypeValidationFailure

/**
 * Used to represent a successful request Sanitization result
 *
 * @template T The type of the Sanitized (filtered and validated) request object
 * @property {T} request The Sanitized (filtered and validated) request object
 */
export type RequestSanitizationSuccess<T> = ValidationResult & {
  isValid: true,
  request: T,
}

/**
 * Used to represent validation errors which occurred during the validation of the Request object
 *
 * @property {ComplexTypeValidationErrors} pathParam Validation errors in URL Path parameter values
 * @property {ComplexTypeValidationErrors} queryParam Validation errors in Query parameter values
 * @property {ComplexTypeValidationErrors} requestBody Validation errors in request body
 * @property {ComplexTypeValidationErrors} header Validation errors in header values
 * @property {ComplexTypeValidationErrors} cookie Validation errors in cookies
 * @property {ComplexTypeValidationErrors} global Validation errors which apply to the request as a whole and aren't specific to any of the other attributes
 */
export const requestValidationErrorsSchema = z.object({
  pathParam: complexTypeValidationErrorsSchema.optional(),
  queryParam: complexTypeValidationErrorsSchema.optional(),
  requestBody: complexTypeValidationErrorsSchema.optional(),
  header: complexTypeValidationErrorsSchema.optional(),
  cookie: complexTypeValidationErrorsSchema.optional(),
  global: complexTypeValidationErrorsSchema.optional(),
})
export type RequestValidationErrors = z.infer<typeof requestValidationErrorsSchema>

/**
 * Used to represent a failed data Sanitization result
 *
 * @property {false} isValid
 * @property {RequestValidationErrors} validationErrors
 */
export type RequestSanitizationFailure = ValidationResult & {
  isValid: false,
  validationErrors: RequestValidationErrors,
}

/**
 * Union type for representing a Request Sanitization Result
 */
export type RequestSanitizationResult<T> = RequestSanitizationSuccess<T> | RequestSanitizationFailure
