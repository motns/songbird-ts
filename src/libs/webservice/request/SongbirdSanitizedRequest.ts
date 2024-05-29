import { HttpMethod } from "../../../enums/http";

export class SongbirdSanitizedRequest<
  PathParams extends Record<string, any> | null,
  QueryParams extends Record<string, any> | null,
  Headers extends Record<string, any> | null,
  Cookies extends Record<string, any> | null,
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
  readonly meta?: Record<string, any>

  constructor(
    method: HttpMethod,
    path: string,
    pathParams: PathParams,
    queryParams: QueryParams,
    headers: Headers,
    cookies: Cookies,
    auth: AuthenticationData,
    body: Body,
    meta?: Record<string, any>,
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
