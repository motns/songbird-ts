import type { HttpMethod } from "../../../enums/http.js";
import type { RawQueryParams, RawRequestHeaders } from "../../../types/webservice.js";

/**
 * Represents a raw HTTP request as it was received by the application,
 * before any validation.
 */
export class RawRequest {
  readonly method: HttpMethod
  readonly path: string
  readonly traceId: string
  readonly pathParams: Record<string, string> | undefined
  readonly queryParams: RawQueryParams | undefined
  readonly headers: RawRequestHeaders | undefined // TODO - include some default headers here in type?
  readonly cookies: Record<string, string> | undefined
  readonly body: Blob | undefined
  readonly meta: Record<string, unknown> | undefined

  constructor(
    method: HttpMethod,
    path: string,
    traceId: string,
    pathParams: Record<string, string> | undefined,
    queryParams: RawQueryParams | undefined,
    headers: RawRequestHeaders | undefined,
    cookies: Record<string, string> | undefined,
    body: Blob | undefined,
    meta: Record<string, unknown> | undefined,
  ) {
    this.method = method
    this.path = path
    this.traceId = traceId
    this.pathParams = pathParams
    this.queryParams = queryParams
    this.headers = headers
    this.cookies = cookies
    this.body = body
    this.meta = meta
  }
}
