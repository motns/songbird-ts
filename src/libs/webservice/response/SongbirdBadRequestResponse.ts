import { EndpointParamType } from "../../../types/webservice";
import { HttpStatus } from "../../../enums/http";
import { SongbirdResponse } from "./SongbirdResponse";
import { ResponseBodyWriter } from "./writer/ResponseBodyWriter";
import { RequestValidationErrors, requestValidationErrorsSchema } from "../../../types/sanitization";

export class SongbirdBadRequestResponse<
  Headers extends EndpointParamType,
  Out
> extends SongbirdResponse<
  Headers,
  RequestValidationErrors,
  Out
>{
  readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST

  constructor(
    writer: ResponseBodyWriter<RequestValidationErrors, Out>,
    headers: Headers,
    validationErrors: RequestValidationErrors
  ) {
    super(validationErrors, writer, headers)
  }
}
