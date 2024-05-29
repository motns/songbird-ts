import { EndpointParamType } from "../../../types/webservice";
import { HttpStatus } from "../../../enums/http";
import { SongbirdResponse } from "./SongbirdResponse";
import { ResponseBodyWriter } from "./writer/ResponseBodyWriter";
import { GenericErrorResponse } from "../../../types/error";

export class SongbirdUnauthorisedResponse<
  Headers extends EndpointParamType,
  Out
> extends SongbirdResponse<
  Headers,
  GenericErrorResponse,
  Out
>{
  readonly httpStatus: HttpStatus = HttpStatus.FORBIDDEN

  constructor(
    writer: ResponseBodyWriter<GenericErrorResponse, Out>,
    headers: Headers,
    error: string = "Client not authorised to access this resource"
  ) {
    super({ error }, writer, headers)
  }
}
