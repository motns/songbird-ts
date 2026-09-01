import type { RouteParamOutputType } from "../../../types/urlUtils.js";
import { routePatternToExpressRoute, routePatternToOpenAPIPath } from "../../urlUtils.js";
import type {
  CookieDefinitions,
  EndpointParamType, EndpointParamZodType,
  EndpointSchemas, PathParamZodType,
  ResponseHeadersType, ResponseHeaderZodType
} from "../../../types/webservice.js";
import * as z from "zod";
import { RequestBodyReader } from "../request/reader/RequestBodyReader.js";
import { ResponseBodyWriter } from "../response/writer/ResponseBodyWriter.js";
import { emptyBodyReader } from "../request/reader/EmptyBodyReader.js";
import { emptyResponseWriter } from "../response/writer/EmptyResponseWriter.js";
import type { RequestValidationErrors } from "../../../types/sanitization.js";
import { jsonErrorMessageWriter } from "../response/writer/error/JsonErrorMessageWriter.js";
import { jsonValidationErrorWriter } from "../response/writer/error/JsonValidationErrorWriter.js";
import { textErrorMessageWriter } from "../response/writer/error/TextErrorMessageWriter.js";
import { textValidationErrorWriter } from "../response/writer/error/TextValidationErrorWriter.js";
import { xmlErrorMessageWriter } from "../response/writer/error/XMLErrorMessageWriter.js";
import { xmlValidationErrorWriter } from "../response/writer/error/XMLValidationErrorWriter.js";
import type { ErrorMessage } from "../response/writer/error/common.js";
import { JsonResponseWriter } from "../response/writer/JsonResponseWriter.js";
import { XMLResponseWriter } from "../response/writer/XMLResponseWriter.js";
import { TextResponseWriter } from "../response/writer/TextResponseWriter.js";
import { JsonBodyReader } from "../request/reader/JsonBodyReader.js";
import { DefaultErrorHandler, type ErrorHandler } from "./ErrorHandler.js";
import { type Logger, SilentLogger } from "../../Logger.js";
import { httpStatus, type HttpStatus } from "../../../enums/http.js";


/**
 * Base class for building REST endpoint definitions, used to describe schemas for all components of both
 * requests and responses. The framework parses components such as headers and parameters into JSON objects,
 * so they can all be validated via Zod schemas.
 * The endpoint definition itself is immutable, so every modification returns a new instance of the class, making
 * these safe to pass around and extend.
 */
export class RestEndpointConfig<
  Route extends string,
  PathParams extends RouteParamOutputType<Route>,
  QueryParams extends EndpointParamType,
  RequestHeaders extends EndpointParamType,
  RequestCookies extends EndpointParamType,
  SuccessResponseHeaders extends ResponseHeadersType,
  SuccessResponseCookies extends CookieDefinitions,
  ErrorResponseHeaders extends ResponseHeadersType,
  ErrorResponseCookies extends CookieDefinitions,
  RequestParserOut,
  SuccessResponseWriterIn,
  SuccessResponseWriterOut,
  ErrorResponseWriterOut,
> {
  /**
   * @public REST URL route with route parameters (indicated by a colon prefix) included.
   *         Simple type annotations are also supported for route parameters, in `<type>` format.
   * @example <caption>Route pattern with simple parameters</caption>
   * /users/:userid
   * @example <caption>Route pattern with typed parameters</caption>
   * /users/:userid<number>
   */
  readonly routePattern: Route

  /**
   * @public Same format as `routePattern`, but with type annotations stripped out
   */
  readonly expressRoute: string

  /**
   * @public Based on `routePattern`, but with type annotations stripped out and reformatted to match OpenAPI path format
   */
  readonly openApiPath: string

  /**
   * @public Zod Schemas for all request and response components for this endpoint
   */
  readonly schemas: EndpointSchemas<
    PathParamZodType<PathParams>,
    EndpointParamZodType<QueryParams>,
    EndpointParamZodType<RequestHeaders>,
    EndpointParamZodType<RequestCookies>,
    ResponseHeaderZodType<SuccessResponseHeaders>,
    ResponseHeaderZodType<ErrorResponseHeaders>
  >

  /**
   * `name => description` map of cookies returned on endpoint success
   */
  readonly successResponseCookies: SuccessResponseCookies

  /**
   * `name => description` map of cookies returned on endpoint failure
   */
  readonly errorResponseCookies: ErrorResponseCookies

  readonly requestBodyReader: RequestBodyReader<RequestParserOut>

  readonly successResponseWriter: ResponseBodyWriter<SuccessResponseWriterIn, SuccessResponseWriterOut>

  readonly errorMessageWriter: ResponseBodyWriter<ErrorMessage, ErrorResponseWriterOut>

  readonly validationErrorWriter: ResponseBodyWriter<RequestValidationErrors, ErrorResponseWriterOut>

  /**
   * Used to construct Songbird error responses with cookies and headers included - needs to be replaced with a custom
   * instance if ErrorResponseHeaders or ErrorResponseCookies are not empty.
   */
  readonly errorHandler: ErrorHandler<
    ErrorResponseHeaders,
    ErrorResponseCookies
  >

  /**
   * Logger instance which will be used by the framework internally
   */
  readonly logger: Logger

  /**
   * @public The HTTP status code returned when the request is successful - defaults to 200 OK
   */
  readonly successHttpStatus: HttpStatus

  constructor(
    routePattern: Route,
    schemas: EndpointSchemas<
      PathParamZodType<PathParams>,
      EndpointParamZodType<QueryParams>,
      EndpointParamZodType<RequestHeaders>,
      EndpointParamZodType<RequestCookies>,
      ResponseHeaderZodType<SuccessResponseHeaders>,
      ResponseHeaderZodType<ErrorResponseHeaders>
    >,
    requestReader: RequestBodyReader<RequestParserOut>,
    successResponseWriter: ResponseBodyWriter<SuccessResponseWriterIn, SuccessResponseWriterOut>,
    successResponseCookies: SuccessResponseCookies,
    errorMessageWriter: ResponseBodyWriter<ErrorMessage, ErrorResponseWriterOut>,
    validationErrorWriter: ResponseBodyWriter<RequestValidationErrors, ErrorResponseWriterOut>,
    errorResponseCookies: ErrorResponseCookies,
    errorHandler: ErrorHandler<
      ErrorResponseHeaders,
      ErrorResponseCookies
    >,
    logger: Logger,
    successHttpStatus: HttpStatus
  ) {
    this.routePattern = routePattern
    this.expressRoute = routePatternToExpressRoute(routePattern)
    this.openApiPath = routePatternToOpenAPIPath(routePattern)
    this.schemas = schemas
    this.requestBodyReader = requestReader
    this.successResponseWriter = successResponseWriter
    this.successResponseCookies = successResponseCookies
    this.errorMessageWriter = errorMessageWriter
    this.validationErrorWriter = validationErrorWriter
    this.errorResponseCookies = errorResponseCookies
    this.errorHandler = errorHandler
    this.logger = logger
    this.successHttpStatus = successHttpStatus
  }

  route<
    NewRoute extends string
  >(
    newRoute: NewRoute,
    newSchema: PathParamZodType<RouteParamOutputType<NewRoute>>
  ): RestEndpointConfig<
    NewRoute,
    RouteParamOutputType<NewRoute>,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      newRoute,
      {
        ...this.schemas,
        pathParams: newSchema
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  queryParams<
    NewQueryParams extends EndpointParamType
  >(
    newSchema: EndpointParamZodType<NewQueryParams>
  ): RestEndpointConfig<
    Route,
    PathParams,
    NewQueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
          ...this.schemas,
          queryParams: newSchema
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  noQueryParams(): RestEndpointConfig<
    Route,
    PathParams,
    Record<string, never>,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        queryParams: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }


  requestHeaders<
    NewRequestHeaders extends EndpointParamType
  >(
    newSchema: EndpointParamZodType<NewRequestHeaders>
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    NewRequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        requestHeaders: newSchema
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  noRequestHeaders(): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    Record<string, never>,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        requestHeaders: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  requestCookies<
    NewRequestCookies extends EndpointParamType
  >(
    newSchema: EndpointParamZodType<NewRequestCookies>
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    NewRequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        requestCookies: newSchema
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  noRequestCookies(): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    Record<string, never>,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        requestCookies: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  requestBody<NewRequestReaderOut>(
    newParser: RequestBodyReader<NewRequestReaderOut>
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    NewRequestReaderOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      this.schemas,
      newParser,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  jsonRequestBody<NewRequestReaderOut>(
    requestBodySchema: z.ZodType<NewRequestReaderOut, unknown>,
    description?: string,
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    NewRequestReaderOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      this.schemas,
      new JsonBodyReader(
        requestBodySchema,
        description
      ),
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  noRequestBody(): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    null,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      this.schemas,
      emptyBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  responseHeaders<
    NewResponseHeaders extends ResponseHeadersType
  >(
    newSchema: ResponseHeaderZodType<NewResponseHeaders>
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    NewResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        successResponseHeaders: newSchema
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  noResponseHeaders(): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    Record<string, never>,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        successResponseHeaders: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  responseCookies<
    NewResponseCookies extends CookieDefinitions
  >(
    newCookies: NewResponseCookies
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    NewResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      this.schemas,
      this.requestBodyReader,
      this.successResponseWriter,
      newCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  noResponseCookies(): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    Record<string, never>,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      this.schemas,
      this.requestBodyReader,
      this.successResponseWriter,
      {},
      this.errorMessageWriter,
      this.validationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  responseBody<
    NewResponseWriterIn,
    NewResponseWriterOut
  >(
    newBodyWriter: ResponseBodyWriter<NewResponseWriterIn, NewResponseWriterOut>,
    newErrorMessageWriter: ResponseBodyWriter<ErrorMessage, NewResponseWriterOut>,
    newValidationErrorWriter: ResponseBodyWriter<RequestValidationErrors, NewResponseWriterOut>
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    NewResponseWriterIn,
    NewResponseWriterOut,
    NewResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      this.schemas,
      this.requestBodyReader,
      newBodyWriter,
      this.successResponseCookies,
      newErrorMessageWriter,
      newValidationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  noResponseBody(): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    unknown,
    null,
    string
  > {
    return new RestEndpointConfig(
      this.routePattern,
      this.schemas,
      this.requestBodyReader,
      emptyResponseWriter,
      this.successResponseCookies,
      textErrorMessageWriter,
      textValidationErrorWriter,
      this.errorResponseCookies,
      this.errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  jsonResponseBody<NewResponseWriterIn>(
    responseSchema: z.ZodType<NewResponseWriterIn, unknown>,
    description?: string,
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    NewResponseWriterIn,
    string, // SuccessResponseWriterOut
    string // ErrorResponseWriterOut
  > {
    return this.responseBody(
      new JsonResponseWriter(responseSchema, description),
      jsonErrorMessageWriter,
      jsonValidationErrorWriter,
    )
  }

  xmlResponseBody<NewResponseWriterIn>(
    responseSchema: z.ZodType<NewResponseWriterIn, unknown>,
    description?: string,
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    NewResponseWriterIn,
    string, // SuccessResponseWriterOut
    string // ErrorResponseWriterOut
  > {
    return this.responseBody(
      new XMLResponseWriter(responseSchema, description),
      xmlErrorMessageWriter,
      xmlValidationErrorWriter,
    )
  }

  textResponseBody(
    description?: string,
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestParserOut,
    string, // SuccessResponseWriterIn
    string, // SuccessResponseWriterOut
    string // ErrorResponseWriterOut
  > {
    return this.responseBody(
      new TextResponseWriter(description),
      textErrorMessageWriter,
      textValidationErrorWriter,
    )
  }

  withErrorHandler<
    NewErrorResponseHeaders extends ResponseHeadersType,
    NewErrorResponseCookies extends CookieDefinitions
  >(
    newErrorHeadersSchema: ResponseHeaderZodType<NewErrorResponseHeaders>,
    newErrorCookies: NewErrorResponseCookies,
    errorHandler: ErrorHandler<NewErrorResponseHeaders, NewErrorResponseCookies>
  ): RestEndpointConfig<
    Route,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    NewErrorResponseHeaders,
    NewErrorResponseCookies,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointConfig(
      this.routePattern,
      {
        ...this.schemas,
        errorResponseHeaders: newErrorHeadersSchema,
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.successResponseCookies,
      this.errorMessageWriter,
      this.validationErrorWriter,
      newErrorCookies,
      errorHandler,
      this.logger,
      this.successHttpStatus,
    )
  }

  static create(): RestEndpointConfig<
    "/", // Route
    Record<string, never>, // PathParams,
    Record<string, never>, // QueryParams
    Record<string, never>, // RequestHeaders
    Record<string, never>, // RequestCookies
    Record<string, never>, // SuccessResponseHeaders
    Record<string, never>, // SuccessResponseCookies
    Record<string, never>, // ErrorResponseHeaders
    Record<string, never>, // ErrorResponseCookies
    null, // RequestParserOut
    unknown, // SuccessResponseWriterIn
    null, // SuccessResponseWriterOut
    string // ErrorResponseWriterOut
  > {
    return new RestEndpointConfig<
      "/",
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      Record<string, never>,
      null,
      unknown,
      null,
      string
    >(
      "/",
      {
        pathParams: z.object({}),
        queryParams: z.object({}),
        requestHeaders: z.object({}),
        requestCookies: z.object({}),
        successResponseHeaders: z.object({}),
        errorResponseHeaders: z.object({}),
      },
      emptyBodyReader,
      emptyResponseWriter,
      {},
      textErrorMessageWriter,
      textValidationErrorWriter,
      {},
      new DefaultErrorHandler(),
      new SilentLogger(),
      httpStatus.OK,
    )
  }
}
