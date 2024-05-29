import { EndpointParamType } from "../../../types/webservice";
import { HttpStatus } from "../../../enums/http";
import { SongbirdResponse } from "./SongbirdResponse";
import { ResponseBodyWriter } from "./writer/ResponseBodyWriter";
import { GenericErrorResponse } from "../../../types/error";

export class SongbirdInternalErrorResponse<
  Headers extends EndpointParamType,
  Out
> extends SongbirdResponse<
  Headers,
  GenericErrorResponse,
  Out
>{
  readonly httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR

  constructor(
    writer: ResponseBodyWriter<GenericErrorResponse, Out>,
    headers: Headers,
    error: string = "Failed to process request"
  ) {
    super({ error }, writer, headers)
  }
}
