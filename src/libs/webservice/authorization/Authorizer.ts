import { SongbirdSanitizedRequest } from "../request/SongbirdSanitizedRequest";
import { EndpointParamType } from "../../../types/webservice";

/**
 * Wraps a handler which performs authorization *after* a request has been validated. If the authorization depends
 * only on information provided by an Authenticator, a `PreAuthorizer` should be preferred for performance and security.
 */
export class Authorizer<
  PathParams extends EndpointParamType,
  QueryParams extends EndpointParamType,
  Headers extends EndpointParamType,
  Cookies extends EndpointParamType,
  AuthenticationData,
  Body,
> {
  protected readonly handler: (req: SongbirdSanitizedRequest<
    PathParams,
    QueryParams,
    Headers,
    Cookies,
    AuthenticationData,
    Body
  >) => Promise<boolean>

  readonly scopes: string[] = []

  constructor(
    handler: (req: SongbirdSanitizedRequest<
      PathParams,
      QueryParams,
      Headers,
      Cookies,
      AuthenticationData,
      Body
    >) => Promise<boolean>,
    scopes: string[] = []
  ) {
    this.handler = handler
    this.scopes = scopes
  }

  isAuthorized(req: SongbirdSanitizedRequest<
    PathParams,
    QueryParams,
    Headers,
    Cookies,
    AuthenticationData,
    Body
  >): Promise<boolean> {
    return this.handler(req);
  }
}
