import { HttpMethod } from "../../../enums/http";

/**
 * Represents a raw HTTP request as it was received by the application,
 * before any validation.
 */
export class SongbirdRawRequest {
  readonly method: HttpMethod
  readonly path: string
  readonly traceId: string
  readonly pathParams?: Record<string, string>
  readonly queryParams?: Record<string, string>
  readonly headers?: Record<string, string> // TODO - include some default headers here in type?
  readonly cookies?: Record<string, string>
  readonly body?: any // TODO - unknown or any?
  readonly meta?: Record<string, any>

  constructor(
    method: HttpMethod,
    path: string,
    traceId: string,
    pathParams?: Record<string, string>,
    queryParams?: Record<string, string>,
    headers?: Record<string, string>,
    cookies?: Record<string, string>,
    body?: any,
    meta?: Record<string, any>,
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