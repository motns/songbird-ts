import { EndpointParamType } from "../../../types/webservice";
import { HttpStatus } from "../../../enums/http";
import { ResponseBodyWriter } from "./writer/ResponseBodyWriter";

export abstract class SongbirdResponse<
  Headers extends EndpointParamType,
  Body,
  Out
> {
  /**
   * HTTP status code for this response, to be set by child classes
   */
  abstract readonly httpStatus: HttpStatus

  /**
   * Typed response headers - to be converted to string before sending to client
   */
  readonly headers: Headers

  /**
   * Typed response data, without serialisation - useful in case any middleware wants to read/transform it down the line
   */
  readonly body: Body

  /**
   * `ResponseWriter` instance which will be used to serialise `data` before sending it to the client
   */
  readonly writer: ResponseBodyWriter<Body, Out>

  protected constructor(
    body: Body,
    writer: ResponseBodyWriter<Body, Out>,
    headers: Headers
  ) {
    this.body = body
    this.writer = writer
    this.headers = headers
  }

  /**
   * Returns the serialised version of the Response body, generated via a `ResponseWriter`
   *
   * @return {Out} The serialized output
   */
  serialise(): Out {
    return this.writer.serialise(this.body)
  }
}
