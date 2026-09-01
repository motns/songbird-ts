import type { CookieDefinitions, ResponseHeadersType } from "../../../types/webservice.js";
import { BadRequestResponse } from "../response/BadRequestResponse.js";
import { InternalErrorResponse } from "../response/InternalErrorResponse.js";
import { UnauthenticatedResponse } from "../response/UnauthenticatedResponse.js";
import { UnauthorisedResponse } from "../response/UnauthorisedResponse.js";
import type { RequestValidationErrors } from "../../../types/sanitization.js";

export interface ErrorHandler<
  ErrorResponseHeaders extends ResponseHeadersType,
  ErrorResponseCookies extends CookieDefinitions,
> {
  handleBadRequest(
    validationErrors: RequestValidationErrors,
  ): BadRequestResponse<ErrorResponseHeaders, ErrorResponseCookies>;
  handleInternalError(
    error?: unknown | undefined,
  ): InternalErrorResponse<ErrorResponseHeaders, ErrorResponseCookies>;
  handleUnauthenticated(): UnauthenticatedResponse<ErrorResponseHeaders, ErrorResponseCookies>;
  handleUnauthorised(): UnauthorisedResponse<ErrorResponseHeaders, ErrorResponseCookies>;
}

export class DefaultErrorHandler implements ErrorHandler<
  Record<string, never>,
  Record<string, never>
> {
  constructor() {}

  handleBadRequest(
    validationErrors: RequestValidationErrors,
  ): BadRequestResponse<Record<string, never>, Record<string, never>> {
    return new BadRequestResponse({}, {}, validationErrors);
  }

  handleInternalError(): InternalErrorResponse<Record<string, never>, Record<string, never>> {
    return new InternalErrorResponse({}, {});
  }

  handleUnauthenticated(): UnauthenticatedResponse<Record<string, never>, Record<string, never>> {
    return new UnauthenticatedResponse({}, {});
  }

  handleUnauthorised(): UnauthorisedResponse<Record<string, never>, Record<string, never>> {
    return new UnauthorisedResponse({}, {});
  }
}
