import { RequestValidationErrors } from "./sanitization";
import { Authenticator } from "../libs/webservice/authentication/Authenticator";

export type AuthenticationSuccess<Output> = {
  readonly isValid: true,
  readonly isAuthenticated: true,
  readonly output: Output,
}

/**
 * Authentication failure due to missing or invalid input parameters in request
 */
export type AuthenticationValidationFailure = {
  readonly isValid: false,
  readonly isAuthenticated: false,
  readonly validationErrors: RequestValidationErrors
}

/**
 * Authentication failure due to invalid credentials, after input parameters have been validated
 */
export type AuthenticationAccessFailure = {
  readonly isValid: true,
  readonly isAuthenticated: false,
  readonly message?: string,
}

export type AuthenticationResult<Output> = AuthenticationSuccess<Output> | AuthenticationAccessFailure | AuthenticationValidationFailure

export type GetAuthenticatorOutput<A extends Authenticator<any>> =
  A extends Authenticator<infer Out>
    ? Out
    : never