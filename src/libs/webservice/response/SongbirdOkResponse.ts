import { EndpointParamType } from "../../../types/webservice";
import { SongbirdResponse } from "./SongbirdResponse";
import { ResponseBodyWriter } from "./writer/ResponseBodyWriter";
import { HttpStatus } from "../../../enums/http";

export class SongbirdOkResponse<
  Headers extends EndpointParamType,
  Body,
  Out
 > extends SongbirdResponse<Headers, Body, Out> {
  readonly httpStatus: HttpStatus = HttpStatus.OK

  constructor(
    body: Body,
    writer: ResponseBodyWriter<Body, Out>,
    headers: Headers
  ) {
      super(body, writer, headers)
  }
}