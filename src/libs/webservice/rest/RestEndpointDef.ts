import { PathParamZodSchema, RouteConcat } from "../../../types/urlUtils";
import { routeConcat, routePatternToOpenAPIPath } from "../../urlUtils";
import { EndpointParamSchemaType, EndpointSchemas } from "../../../types/webservice";
import { z, ZodObject } from "zod";
import { RequestBodyReader } from "../request/reader/RequestBodyReader";
import { ResponseBodyWriter } from "../response/writer/ResponseBodyWriter";
import { emptyBodyReader } from "../request/reader/EmptyBodyReader";
import { emptyResponseWriter } from "../response/writer/EmptyResponseWriter";
import { RequestValidationErrors } from "../../../types/sanitization";
import { jsonErrorMessageWriter } from "../response/writer/error/JsonErrorMessageWriter";
import { jsonValidationErrorWriter } from "../response/writer/error/JsonValidationErrorWriter";
import { MimeType } from "../../../enums/mime";
import { textErrorMessageWriter } from "../response/writer/error/TextErrorMessageWriter";
import { textValidationErrorWriter } from "../response/writer/error/TextValidationErrorWriter";
import { xmlErrorMessageWriter } from "../response/writer/error/XMLErrorMessageWriter";
import { xmlValidationErrorWriter } from "../response/writer/error/XMLValidationErrorWriter";

/**
 * Base class for building REST endpoint definitions, used to describe schemas for all components of both
 * requests and responses. The framework parses components such as headers and parameters into JSON objects,
 * so they can all be validated via Zod schemas.
 * The endpoint definition itself is immutable, so every modification returns a new instance of the class, making
 * these safe to pass around and extend.
 */
export class RestEndpointDef<
  Route extends string,
  PathParamsSchema extends PathParamZodSchema<Route>,
  QueryParamsSchema extends EndpointParamSchemaType,
  RequestHeadersSchema extends EndpointParamSchemaType,
  RequestCookiesSchema extends EndpointParamSchemaType,
  ResponseHeadersSchema extends EndpointParamSchemaType,
  ResponseCookiesSchema extends EndpointParamSchemaType,
  RequestParserIn,
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
   * @public Based on `routePattern`, but with type annotations stripped out and reformatted to match OpenAPI path format
   */
  readonly openApiPath: string

  /**
   * @public Zod Schemas for all request and response components for this endpoint
   */
  readonly schemas: EndpointSchemas<
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema
  >

  readonly requestBodyReader: RequestBodyReader<RequestParserIn, RequestParserOut>

  readonly successResponseWriter: ResponseBodyWriter<SuccessResponseWriterIn, SuccessResponseWriterOut>

  readonly errorMessageWriter: ResponseBodyWriter<{ error: string }, ErrorResponseWriterOut>

  readonly validationErrorWriter: ResponseBodyWriter<RequestValidationErrors, ErrorResponseWriterOut>

  constructor(
    routePattern: Route,
    schemas: EndpointSchemas<
      PathParamsSchema,
      QueryParamsSchema,
      RequestHeadersSchema,
      RequestCookiesSchema,
      ResponseHeadersSchema,
      ResponseCookiesSchema
    >,
    requestReader: RequestBodyReader<RequestParserIn, RequestParserOut>,
    successResponseWriter: ResponseBodyWriter<SuccessResponseWriterIn, SuccessResponseWriterOut>,
    errorMessageWriter: ResponseBodyWriter<{ error: string }, ErrorResponseWriterOut>,
    validationErrorWriter: ResponseBodyWriter<RequestValidationErrors, ErrorResponseWriterOut>,
  ) {
    this.routePattern = routePattern
    this.openApiPath = routePatternToOpenAPIPath(routePattern)
    this.schemas = schemas
    this.requestBodyReader = requestReader
    this.successResponseWriter = successResponseWriter
    this.errorMessageWriter = errorMessageWriter
    this.validationErrorWriter = validationErrorWriter
  }

  route<
    NewRoute extends string
  >(newRoute: NewRoute, newSchema: PathParamZodSchema<NewRoute>): RestEndpointDef<
    NewRoute,
    PathParamZodSchema<NewRoute>,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      newRoute,
      {
        ...this.schemas,
        pathParams: newSchema
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  appendRoute<
    RouteSuffix extends string
  >(
    routeSuffix: RouteSuffix,
    suffixSchema: PathParamZodSchema<RouteSuffix>
  ): RestEndpointDef<
    RouteConcat<Route, RouteSuffix>,
    PathParamZodSchema<RouteConcat<Route, RouteSuffix>>,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    const mergedPathParamsSchema = (this.schemas.pathParams != z.object({}))
      ? (suffixSchema != z.object({}))
        ? (this.schemas.pathParams).merge(suffixSchema)
        : this.schemas.pathParams
      : suffixSchema

    return new RestEndpointDef(
      routeConcat<Route, RouteSuffix>(this.routePattern, routeSuffix),
      {
        ...this.schemas,
        // TODO - Figure out why this doesn't work without the type cast...
        pathParams: mergedPathParamsSchema as PathParamZodSchema<RouteConcat<Route, RouteSuffix>>,
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  queryParams<
    NewSchema extends EndpointParamSchemaType
  >(schemaAmendFn: (s: QueryParamsSchema) => NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    NewSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  queryParams<
    NewSchema extends EndpointParamSchemaType = ZodObject<{}>
  >(newSchemaOrFn: NewSchema | ((s: QueryParamsSchema) => NewSchema)): RestEndpointDef<
    Route,
    PathParamsSchema,
    NewSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    if (typeof newSchemaOrFn === 'function') {
      return new RestEndpointDef(
          this.routePattern,
          {
              ...this.schemas,
              queryParams: newSchemaOrFn(this.schemas.queryParams)
          },
          this.requestBodyReader,
          this.successResponseWriter,
        this.errorMessageWriter,
        this.validationErrorWriter,
      )
    }

    return new RestEndpointDef(
      this.routePattern,
      {
          ...this.schemas,
          queryParams: newSchemaOrFn
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  noQueryParams(): RestEndpointDef<
    Route,
    PathParamsSchema,
    EndpointParamSchemaType,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        queryParams: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  requestHeaders<
    NewSchema extends EndpointParamSchemaType
  >(newSchema: NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    NewSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  requestHeaders<
    NewSchema extends EndpointParamSchemaType
  >(schemaAmendFn: (s: RequestHeadersSchema) => NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    NewSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  requestHeaders<
    NewSchema extends EndpointParamSchemaType
  >(newSchemaOrFn: NewSchema | ((s: RequestHeadersSchema) => NewSchema)): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    NewSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    if (typeof newSchemaOrFn === 'function') {
      return new RestEndpointDef(
        this.routePattern,
        {
          ...this.schemas,
          requestHeaders: newSchemaOrFn(this.schemas.requestHeaders)
        },
        this.requestBodyReader,
        this.successResponseWriter,
        this.errorMessageWriter,
        this.validationErrorWriter,
      )
    }

    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        requestHeaders: newSchemaOrFn
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  noRequestHeaders(): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    EndpointParamSchemaType,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        requestHeaders: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  requestCookies<
    NewSchema extends EndpointParamSchemaType
  >(newSchema: NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    NewSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  requestCookies<
    NewSchema extends EndpointParamSchemaType
  >(schemaAmendFn: (s: RequestCookiesSchema) => NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    NewSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  requestCookies<
    NewSchema extends EndpointParamSchemaType
  >(newSchemaOrFn: NewSchema | ((s: RequestCookiesSchema) => NewSchema)): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    NewSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    if (typeof newSchemaOrFn === 'function') {
      return new RestEndpointDef(
        this.routePattern,
        {
          ...this.schemas,
          requestCookies: newSchemaOrFn(this.schemas.requestCookies)
        },
        this.requestBodyReader,
        this.successResponseWriter,
        this.errorMessageWriter,
        this.validationErrorWriter,
      )
    }

    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        requestCookies: newSchemaOrFn
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  noRequestCookies(): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    EndpointParamSchemaType,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        requestCookies: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  requestBody<
    NewRequestReaderIn,
    NewRequestReaderOut,
  >(newParser: RequestBodyReader<NewRequestReaderIn, NewRequestReaderOut>): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    NewRequestReaderIn,
    NewRequestReaderOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      this.schemas,
      newParser,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  noRequestBody(): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    any,
    null,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      this.schemas,
      emptyBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  responseHeaders<
    NewSchema extends EndpointParamSchemaType
  >(newSchema: NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    NewSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  responseHeaders<
    NewSchema extends EndpointParamSchemaType
  >(schemaAmendFn: (s: ResponseHeadersSchema) => NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    NewSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  responseHeaders<
    NewSchema extends EndpointParamSchemaType
  >(newSchemaOrFn: NewSchema | ((s: ResponseHeadersSchema) => NewSchema)): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    NewSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    if (typeof newSchemaOrFn === 'function') {
      return new RestEndpointDef(
        this.routePattern,
        {
          ...this.schemas,
          responseHeaders: newSchemaOrFn(this.schemas.responseHeaders)
        },
        this.requestBodyReader,
        this.successResponseWriter,
        this.errorMessageWriter,
        this.validationErrorWriter,
      )
    }

    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        responseHeaders: newSchemaOrFn
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  noResponseHeaders(): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    EndpointParamSchemaType,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        responseHeaders: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  responseCookies<
    NewSchema extends EndpointParamSchemaType
  >(newSchema: NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    NewSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  responseCookies<
    NewSchema extends EndpointParamSchemaType
  >(schemaAmendFn: (s: ResponseCookiesSchema) => NewSchema): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    NewSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >;
  responseCookies<
    NewSchema extends EndpointParamSchemaType
  >(newSchemaOrFn: NewSchema | ((s: ResponseCookiesSchema) => NewSchema)): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    NewSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    if (typeof newSchemaOrFn === 'function') {
      return new RestEndpointDef(
        this.routePattern,
        {
          ...this.schemas,
          responseCookies: newSchemaOrFn(this.schemas.responseCookies)
        },
        this.requestBodyReader,
        this.successResponseWriter,
        this.errorMessageWriter,
        this.validationErrorWriter,
      )
    }

    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        responseCookies: newSchemaOrFn
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  noResponseCookies(): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    EndpointParamSchemaType,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      {
        ...this.schemas,
        responseCookies: z.object({})
      },
      this.requestBodyReader,
      this.successResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  responseBody<
    NewResponseWriterIn,
    NewResponseWriterOut
  >(newWriter: ResponseBodyWriter<NewResponseWriterIn, NewResponseWriterOut>): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    NewResponseWriterIn,
    NewResponseWriterOut,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      this.schemas,
      this.requestBodyReader,
      newWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  noResponseBody(): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    any,
    null,
    ErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      this.schemas,
      this.requestBodyReader,
      emptyResponseWriter,
      this.errorMessageWriter,
      this.validationErrorWriter,
    )
  }

  errorResponseMimeType(mimeType: MimeType.JSON | MimeType.TXT | MimeType.XML) {
    if (mimeType == MimeType.JSON) {
      return this.errorResponseWriter(
        jsonErrorMessageWriter,
        jsonValidationErrorWriter,
      )
    } else if (mimeType == MimeType.TXT) {
      return this.errorResponseWriter(
        textErrorMessageWriter,
        textValidationErrorWriter,
      )
    } else if (mimeType == MimeType.XML) {
      return this.errorResponseWriter(
        xmlErrorMessageWriter,
        xmlValidationErrorWriter,
      )
    }
  }

  errorResponseWriter<NewErrorResponseWriterOut>(
    newErrorMessageWriter: ResponseBodyWriter<{ error: string }, NewErrorResponseWriterOut>,
    newValidationErrorWriter: ResponseBodyWriter<RequestValidationErrors, NewErrorResponseWriterOut>,
  ): RestEndpointDef<
    Route,
    PathParamsSchema,
    QueryParamsSchema,
    RequestHeadersSchema,
    RequestCookiesSchema,
    ResponseHeadersSchema,
    ResponseCookiesSchema,
    RequestParserIn,
    RequestParserOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    NewErrorResponseWriterOut
  > {
    return new RestEndpointDef(
      this.routePattern,
      this.schemas,
      this.requestBodyReader,
      this.successResponseWriter,
      newErrorMessageWriter,
      newValidationErrorWriter,
    )
  }

  static create(): RestEndpointDef<
    "/",
    ZodObject<{}>,
    ZodObject<{}>,
    ZodObject<{}>,
    ZodObject<{}>,
    ZodObject<{}>,
    ZodObject<{}>,
    any,
    null,
    any,
    null,
    string
  > {
    return new RestEndpointDef<
      "/",
      ZodObject<{}>,
      ZodObject<{}>,
      ZodObject<{}>,
      ZodObject<{}>,
      ZodObject<{}>,
      ZodObject<{}>,
      any,
      null,
      any,
      null,
      string
    >(
      "/",
      {
        pathParams: z.object({}),
        queryParams: z.object({}),
        requestHeaders: z.object({}),
        requestCookies: z.object({}),
        responseHeaders: z.object({}),
        responseCookies: z.object({}),
      },
      emptyBodyReader,
      emptyResponseWriter,
      jsonErrorMessageWriter,
      jsonValidationErrorWriter,
    )
  }
}
