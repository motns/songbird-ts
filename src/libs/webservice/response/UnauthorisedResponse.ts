import type {
  CookieDefinitions,
  ResponseCookiesType,
  ResponseHeadersType,
} from "../../../types/index.js";
import { httpStatus, type HttpStatus } from "../../../enums/http.js";
import { SongbirdResponse } from "./SongbirdResponse.js";
import type { GenericErrorResponse } from "../../../types/error.js";

export class UnauthorisedResponse<
  Headers extends ResponseHeadersType,
  Cookies extends CookieDefinitions,
> extends SongbirdResponse<Headers, Cookies, GenericErrorResponse> {
  readonly httpStatus: HttpStatus = httpStatus.FORBIDDEN;

  constructor(
    headers: Headers,
    cookies: ResponseCookiesType<Cookies>,
    errorOpt?: string | undefined,
  ) {
    const error = errorOpt || "Client not authorised to access this resource";
    super({ error }, headers, cookies);
  }
}
