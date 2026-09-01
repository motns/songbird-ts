import type {
  CookieDefinitions,
  RequestValidationErrors,
  ResponseCookiesType,
  ResponseHeadersType
} from "../../../types/index.js";
import { httpStatus, type HttpStatus } from "../../../enums/http.js";
import { SongbirdResponse } from "./SongbirdResponse.js";


export class BadRequestResponse<
  Headers extends ResponseHeadersType,
  Cookies extends CookieDefinitions
> extends SongbirdResponse<
  Headers,
  Cookies,
  RequestValidationErrors
>{
  readonly httpStatus: HttpStatus = httpStatus.BAD_REQUEST

  constructor(
    headers: Headers,
    cookies: ResponseCookiesType<Cookies>,
    validationErrors: RequestValidationErrors,
  ) {
    super(validationErrors, headers, cookies)
  }
}
