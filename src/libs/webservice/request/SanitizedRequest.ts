import type { HttpMethod } from "../../../enums/http.js";
import type { EndpointParamType, PathParamType } from "../../../types/index.js";

/**
 * Represents a request which has been fully validated and sanitised.
 */
export class SanitizedRequest<
  PathParams extends PathParamType,
  QueryParams extends EndpointParamType,
  Headers extends EndpointParamType,
  Cookies extends EndpointParamType,
  AuthenticationData,
  Body,
> {
  readonly method: HttpMethod
  readonly path: string
  readonly pathParams: PathParams
  readonly queryParams: QueryParams
  readonly headers: Headers
  readonly cookies: Cookies
  readonly auth: AuthenticationData
  readonly body: Body
  readonly meta: Record<string, unknown> | undefined

  constructor(
    method: HttpMethod,
    path: string,
    pathParams: PathParams,
    queryParams: QueryParams,
    headers: Headers,
    cookies: Cookies,
    auth: AuthenticationData,
    body: Body,
    meta?: Record<string, unknown>,
  ) {
    this.method = method
    this.path = path
    this.pathParams = pathParams
    this.queryParams = queryParams
    this.headers = headers
    this.cookies = cookies
    this.auth = auth
    this.body = body
    this.meta = meta
  }
}
