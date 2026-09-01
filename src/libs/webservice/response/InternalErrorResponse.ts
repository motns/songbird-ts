import type { CookieDefinitions, ResponseCookiesType, ResponseHeadersType } from "../../../types/index.js";
import { httpStatus, type HttpStatus } from "../../../enums/http.js";
import { SongbirdResponse } from "./SongbirdResponse.js";
import type { GenericErrorResponse } from "../../../types/error.js";


export class InternalErrorResponse<
  Headers extends ResponseHeadersType,
  Cookies extends CookieDefinitions
> extends SongbirdResponse<
  Headers,
  Cookies,
  GenericErrorResponse
>{
  readonly httpStatus: HttpStatus = httpStatus.INTERNAL_SERVER_ERROR

  constructor(
    headers: Headers,
    cookies: ResponseCookiesType<Cookies>,
    errorOpt?: string | undefined,
  ) {
    const error = errorOpt || "Failed to process request"
    super({ error }, headers, cookies)
  }
}
