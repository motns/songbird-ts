import type {
  CookieDefinitions,
  ResponseCookiesType,
  ResponseHeadersType,
} from "../../../types/index.js";
import { SongbirdResponse } from "./SongbirdResponse.js";
import { httpStatus, type HttpStatus } from "../../../enums/http.js";

export class OkResponse<
  Headers extends ResponseHeadersType,
  Cookies extends CookieDefinitions,
  Body,
> extends SongbirdResponse<Headers, Cookies, Body> {
  readonly httpStatus: HttpStatus = httpStatus.OK;

  constructor(body: Body, headers: Headers, cookies: ResponseCookiesType<Cookies>) {
    super(body, headers, cookies);
  }
}
