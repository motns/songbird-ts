import { SanitizedRequest } from "../request/SanitizedRequest.js";
import type { EndpointParamType, PathParamType } from "../../../types/webservice.js";

/**
 * Wraps a handler which performs authorisation *after* a request has been validated. If the authorization depends
 * only on information provided by an Authenticator, a `PreAuthorizer` should be preferred for performance and security.
 */
export class Authorizer<
  PathParams extends PathParamType,
  QueryParams extends EndpointParamType,
  Headers extends EndpointParamType,
  Cookies extends EndpointParamType,
  AuthenticationData,
  Body,
> {
  protected readonly handler: (
    req: SanitizedRequest<PathParams, QueryParams, Headers, Cookies, AuthenticationData, Body>,
  ) => Promise<boolean>;

  readonly scopes: string[] = [];

  constructor(
    handler: (
      req: SanitizedRequest<PathParams, QueryParams, Headers, Cookies, AuthenticationData, Body>,
    ) => Promise<boolean>,
    scopes: string[] = [],
  ) {
    this.handler = handler;
    this.scopes = scopes;
  }

  isAuthorized(
    req: SanitizedRequest<PathParams, QueryParams, Headers, Cookies, AuthenticationData, Body>,
  ): Promise<boolean> {
    return this.handler(req);
  }
}
