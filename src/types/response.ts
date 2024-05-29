import { SongbirdOkResponse } from "../libs/webservice/response/SongbirdOkResponse";
import { EndpointParamType } from "./webservice";
import { SongbirdBadRequestResponse } from "../libs/webservice/response/SongbirdBadRequestResponse";
import { SongbirdInternalErrorResponse } from "../libs/webservice/response/SongbirdInternalErrorResponse";
import { SongbirdUnauthenticatedResponse } from "../libs/webservice/response/SongbirdUnauthenticatedResponse";
import { SongbirdUnauthorisedResponse } from "../libs/webservice/response/SongbirdUnauthorisedResponse";

export type SongbirdResponses<
  ResponseHeaders extends EndpointParamType,
  SuccessResponseWriterIn,
  SuccessResponseWriterOut,
  ErrorResponseWriterOut
> =
  SongbirdOkResponse<ResponseHeaders, SuccessResponseWriterIn, SuccessResponseWriterOut>
  | SongbirdBadRequestResponse<ResponseHeaders, ErrorResponseWriterOut>
  | SongbirdInternalErrorResponse<ResponseHeaders, ErrorResponseWriterOut>
  | SongbirdUnauthenticatedResponse<ResponseHeaders, ErrorResponseWriterOut>
  | SongbirdUnauthorisedResponse<ResponseHeaders, ErrorResponseWriterOut>