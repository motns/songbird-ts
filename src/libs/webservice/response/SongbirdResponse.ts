import type { CookieDefinitions, ResponseCookiesType, ResponseHeadersType } from "../../../types/index.js";
import type { HttpStatus } from "../../../enums/http.js";


/**
 * Base class for all responses returned by Songbird success and error handlers.
 */
export abstract class SongbirdResponse<
  Headers extends ResponseHeadersType,
  Cookies extends CookieDefinitions,
  Body
> {
  /**
   * HTTP status code for this response, to be set by child classes
   */
  abstract readonly httpStatus: HttpStatus

  /**
   * Typed response headers - to be converted to string before sending to client
   */
  readonly headers: Headers

  /**
   * Typed response cookies - to be converted to string before sending to client
   */
  readonly cookies: ResponseCookiesType<Cookies>

  /**
   * Typed response data, without serialisation - useful in case any middleware wants to read/transform it down the line
   */
  readonly body: Body

  protected constructor(
    body: Body,
    headers: Headers,
    cookies: ResponseCookiesType<Cookies>
  ) {
    this.body = body
    this.headers = headers
    this.cookies = cookies
  }
}
