import type { CookieDefinitions, ResponseHeadersType } from "../../../types/webservice.js";
import type { ResponseBodyWriter } from "./writer/ResponseBodyWriter.js";
import type { SongbirdResponse } from "./SongbirdResponse.js";


export class EndpointResponse<
  Headers extends ResponseHeadersType,
  Cookies extends CookieDefinitions,
  Body,
  Out
> {
  /**
   * Response object returned by a success or error handler
   */
  readonly response: SongbirdResponse<Headers, Cookies, Body>

  /**
   * `ResponseWriter` instance which will be used to serialise `body` before sending it to the client
   */
  readonly writer: ResponseBodyWriter<Body, Out>

  constructor(
    response: SongbirdResponse<Headers, Cookies, Body>,
    writer: ResponseBodyWriter<Body, Out>
  ) {
    this.response = response
    this.writer = writer
  }

  /**
   * Serialise the response body using the configured `writer` before sending to the client
   */
  serialiseBody(): Out {
    return this.writer.serialise(this.response.body)
  }
}
