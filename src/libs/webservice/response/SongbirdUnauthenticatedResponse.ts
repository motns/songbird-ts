import { EndpointParamType } from "../../../types/webservice";
import { HttpStatus } from "../../../enums/http";
import { SongbirdResponse } from "./SongbirdResponse";
import { ResponseBodyWriter } from "./writer/ResponseBodyWriter";
import { GenericErrorResponse } from "../../../types/error";

export class SongbirdUnauthenticatedResponse<
  Headers extends EndpointParamType,
  Out
> extends SongbirdResponse<
  Headers,
  GenericErrorResponse,
  Out
>{
  readonly httpStatus: HttpStatus = HttpStatus.UNAUTHORIZED

  constructor(
    writer: ResponseBodyWriter<GenericErrorResponse, Out>,
    headers: Headers,
    error: string = "Authentication failed"
  ) {
    super({ error }, writer, headers)
  }
}
