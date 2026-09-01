import { unique } from "remeda";
import type { RouteParamOutputType } from "../../../types/urlUtils.js";
import { type HttpMethod, httpStatus, type HttpStatus } from "../../../enums/http.js";
import { RawRequest, SanitizedRequest } from "../request/index.js";
import type {
  AuthenticationResult,
  ComplexTypeValidationErrors,
  ComplexValidationResult,
  CookieDefinitions,
  EndpointParamType,
  RequestSanitizationResult,
  RequestValidationErrors,
  RequestValidatorFunction,
  ResponseHeadersType
} from "../../../types/index.js";
import { mergeComplexTypeValidationErrors } from "../../validation.js";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { Authenticator } from "../authentication/index.js";
import { Authorizer, PreAuthorizer } from "../authorization/index.js";
import { RestEndpointConfig } from "./RestEndpointConfig.js";
import { ZodSchemaSanitizer } from "../../sanitization/index.js";
import type { OkResponse } from "../response/index.js";
import { EndpointResponse } from "../response/index.js";
import type { GenericErrorResponse } from "../../../types/error.js";
import { isEmptySchema } from "../../schemaUtils.js";


// TODO - Configuration object for behaviours (for example whether to 404 on invalid path parameters)
export class RestEndpoint<
  RoutePattern extends string,
  PathParams extends RouteParamOutputType<RoutePattern>,
  QueryParams extends EndpointParamType,
  RequestHeaders extends EndpointParamType,
  RequestCookies extends EndpointParamType,
  RequestReaderOut,
  SuccessResponseHeaders extends ResponseHeadersType,
  SuccessResponseCookies extends CookieDefinitions,
  ErrorResponseHeaders extends ResponseHeadersType,
  ErrorResponseCookies extends CookieDefinitions,
  SuccessResponseWriterIn,
  SuccessResponseWriterOut,
  ErrorResponseWriterOut,
  AuthOutput,
> {
  /**
   * @public Unique OpenAPI Operation ID for this endpoint, to be used when documenting, logging and instrumenting
   */
  readonly operationId: string

  /**
   * @public Short description of endpoint, used for generated OpenAPI docs
   */
  readonly endpointSummary: string

  /**
   * @public Extended description of endpoint, used for generated OpenAPI docs
   */
  readonly endpointDescription: string

  /**
   * @public List of tags to apply to this endpoint in the OpenAPI documentation
   */
  readonly tags: string[]

  /**
   * @public HTTP Method for this endpoint
   */
  readonly method: HttpMethod

  /**
   * @public Contains OpenAPI definition for this endpoint to be added to the zod-to-openapi Registry
   */
  readonly openApiDefinition: RouteConfig

  /**
   * @public Endpoint definition this endpoint, containing schema information on expected request/response parameters.
   */
  readonly config: RestEndpointConfig<
    RoutePattern,
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    SuccessResponseHeaders,
    SuccessResponseCookies,
    ErrorResponseHeaders,
    ErrorResponseCookies,
    RequestReaderOut,
    SuccessResponseWriterIn,
    SuccessResponseWriterOut,
    ErrorResponseWriterOut
  >

  readonly authenticator: Authenticator<AuthOutput>

  readonly preAuthorizer: PreAuthorizer<AuthOutput> | undefined

  readonly authorizer: Authorizer<
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    AuthOutput,
    RequestReaderOut
  > | undefined

  /**
   * @public Request handler function for this endpoint
   */
  readonly requestHandler: (req: SanitizedRequest<
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    AuthOutput,
    RequestReaderOut
  >) => Promise<OkResponse<
    SuccessResponseHeaders,
    SuccessResponseCookies,
    SuccessResponseWriterIn
  >>

  /**
   * @public The HTTP status code returned when the request is successful - defaults to 200 OK
   */
  readonly successHttpStatus: HttpStatus

  /**
   * @public Used to define additional validators not covered in the first round of Zod validation/sanitization
   */
  readonly additionalRequestValidators: RequestValidatorFunction<
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestReaderOut
  >[] | undefined

  constructor({
    operationId,
    docs,
    method,
    endpointConfig,
    authenticator,
    requestHandler,
    preAuthorizer,
    authorizer,
    additionalRequestValidators,
    successHttpStatus
  }: {
    operationId: string,
    docs: {
      endpointSummary: string,
      endpointDescription: string,
      tags?: string[],
    },
    method: HttpMethod,
    endpointConfig: RestEndpointConfig<
      RoutePattern,
      PathParams,
      QueryParams,
      RequestHeaders,
      RequestCookies,
      SuccessResponseHeaders,
      SuccessResponseCookies,
      ErrorResponseHeaders,
      ErrorResponseCookies,
      RequestReaderOut,
      SuccessResponseWriterIn,
      SuccessResponseWriterOut,
      ErrorResponseWriterOut
    >,
    authenticator: Authenticator<AuthOutput>,
    requestHandler: (req: SanitizedRequest<
      PathParams,
      QueryParams,
      RequestHeaders,
      RequestCookies,
      AuthOutput,
      RequestReaderOut
    >) => Promise<OkResponse<
      SuccessResponseHeaders,
      SuccessResponseCookies,
      SuccessResponseWriterIn
    >>,
    preAuthorizer?: PreAuthorizer<AuthOutput>,
    authorizer?: Authorizer<
      PathParams,
      QueryParams,
      RequestHeaders,
      RequestCookies,
      AuthOutput,
      RequestReaderOut
    >,
    additionalRequestValidators?: RequestValidatorFunction<
      PathParams,
      QueryParams,
      RequestHeaders,
      RequestReaderOut
    >[],
    successHttpStatus?: HttpStatus,
  }) {
    this.operationId = operationId
    this.endpointSummary = docs.endpointSummary
    this.endpointDescription = docs.endpointDescription
    this.tags = docs.tags || []
    this.method = method
    this.config = endpointConfig
    this.authenticator = authenticator
    this.preAuthorizer = preAuthorizer
    this.authorizer = authorizer
    this.requestHandler = requestHandler
    this.additionalRequestValidators = additionalRequestValidators
    this.successHttpStatus = successHttpStatus || httpStatus.OK
    this.openApiDefinition = this.generateOpenApiDefinition()
  }

  async processRequest(
    rawRequest: RawRequest
  ): Promise<
    EndpointResponse<
      SuccessResponseHeaders,
      SuccessResponseCookies,
      SuccessResponseWriterIn,
      SuccessResponseWriterOut
    > |
    EndpointResponse<
      ErrorResponseHeaders,
      ErrorResponseCookies,
      RequestValidationErrors,
      ErrorResponseWriterOut
    > |
    EndpointResponse<
      ErrorResponseHeaders,
      ErrorResponseCookies,
      GenericErrorResponse,
      ErrorResponseWriterOut
    >
  > {
    try {
      const authenticationResult = await this.authenticateRequest(rawRequest)

      // Authenticators perform their own parameter validation, hence they can also
      // emit their own request validation errors
      if (!authenticationResult.isValid) {
        return new EndpointResponse(
          this.config.errorHandler.handleBadRequest(authenticationResult.validationErrors),
          this.config.validationErrorWriter,
        )
      }

      if (!authenticationResult.isAuthenticated) {
        return new EndpointResponse(
          this.config.errorHandler.handleUnauthenticated(),
          this.config.errorMessageWriter,
        )
      }

      if (!this.preAuthorizeRequest(authenticationResult.output)) {
        return new EndpointResponse(
          this.config.errorHandler.handleUnauthorised(),
          this.config.errorMessageWriter,
        )
      }

      const requestSanitizationResult = await this.sanitizeRequest(rawRequest, authenticationResult.output)

      if (!requestSanitizationResult.isValid) {
        if (requestSanitizationResult.validationErrors.pathParam) {
          // TODO - Optional 404 response?
        }

        return new EndpointResponse(
          this.config.errorHandler.handleBadRequest(requestSanitizationResult.validationErrors),
          this.config.validationErrorWriter,
        )
      }

      if (!await this.authorizeRequest(requestSanitizationResult.request)) {
        return new EndpointResponse(
          this.config.errorHandler.handleUnauthorised(),
          this.config.errorMessageWriter,
        )
      }

      return new EndpointResponse(
        await this.requestHandler(requestSanitizationResult.request),
        this.config.successResponseWriter,
      )
    } catch (e) {
      return new EndpointResponse(
        this.config.errorHandler.handleInternalError(e),
        this.config.errorMessageWriter,
      )
    }
  }

  private async authenticateRequest(req: RawRequest): Promise<AuthenticationResult<AuthOutput>> {
    return await this.authenticator.authenticate(req)
  }

  /**
   * @private Used to perform request authorisation *before* full request validation
   */
  private preAuthorizeRequest(authResponse: AuthOutput): boolean {
    return (this.preAuthorizer) ? this.preAuthorizer.isAuthorized(authResponse) : true;
  }

  /**
   * @private Used to perform request authorisation *after* full request validation
   */
  private async authorizeRequest(request: SanitizedRequest<
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    AuthOutput,
    RequestReaderOut
  >): Promise<boolean> {
    if (!this.authorizer) {
      return true;
    }

    return this.authorizer.isAuthorized(request);
  }

  private async sanitizeRequest(
    rawRequest: RawRequest,
    authenticationOutput: AuthOutput
  ): Promise<RequestSanitizationResult<SanitizedRequest<
    PathParams,
    QueryParams,
    RequestHeaders,
    RequestCookies,
    AuthOutput,
    RequestReaderOut
  >>> {
    // There's currently no way to distinguish between sync and async Zod schemas, in fact Zod always processes
    // validation as async internally anyway, so trying to optimise this is redundant...
    const [
      pathParamsSR,
      queryParamsSR,
      headersSR,
      cookiesSR,
      requestBodySR,
    ] = await Promise.all([
      (new ZodSchemaSanitizer(this.config.schemas.pathParams)).process(rawRequest.pathParams),
      (new ZodSchemaSanitizer(this.config.schemas.queryParams)).process(rawRequest.queryParams),
      (new ZodSchemaSanitizer(this.config.schemas.requestHeaders)).process(rawRequest.headers),
      (new ZodSchemaSanitizer(this.config.schemas.requestCookies)).process(rawRequest.cookies),
      this.config.requestBodyReader.parse(rawRequest.body)
    ])

    const isSanitizationValid =
      pathParamsSR.isValid
      && queryParamsSR.isValid
      && headersSR.isValid
      && cookiesSR.isValid
      && requestBodySR.isValid

    if (!isSanitizationValid) {
      return {
        isValid: false,
        validationErrors: {
          pathParam: (!pathParamsSR.isValid) ? pathParamsSR.validationErrors : undefined,
          queryParam: (!queryParamsSR.isValid) ? queryParamsSR.validationErrors : undefined,
          header: (!headersSR.isValid) ? headersSR.validationErrors : undefined,
          cookie: (!cookiesSR.isValid) ? cookiesSR.validationErrors : undefined,
          requestBody: (!requestBodySR.isValid) ? requestBodySR.validationErrors : undefined,
        },
      }
    }

    if (!this.additionalRequestValidators) {
      return {
        isValid: true,
        request: new SanitizedRequest(
          this.method,
          rawRequest.path,
          pathParamsSR.data,
          queryParamsSR.data,
          headersSR.data,
          cookiesSR.data,
          authenticationOutput,
          requestBodySR.data,
        )
      }
    }

    const additionalValidatorPromises: Promise<ComplexValidationResult>[] = []

    for (const v of this.additionalRequestValidators) {
      additionalValidatorPromises.push(
        v(pathParamsSR.data, queryParamsSR.data, headersSR.data, requestBodySR.data)
      )
    }

    const additionalValidatorResults: ComplexValidationResult[] = await Promise.all(additionalValidatorPromises)

    let isValidationSuccessful = true
    const validationErrors: ComplexTypeValidationErrors[] = []

    for (const res of additionalValidatorResults) {
      if (!res.isValid) {
        isValidationSuccessful = false
        validationErrors.push(res.validationErrors)
      }
    }

    if (isValidationSuccessful) {
      return {
        isValid: true,
        request: new SanitizedRequest(
          this.method,
          rawRequest.path,
          pathParamsSR.data,
          queryParamsSR.data,
          headersSR.data,
          cookiesSR.data,
          authenticationOutput,
          requestBodySR.data,
        )
      }
    }

    return {
      isValid: false,
      validationErrors: {
        global: validationErrors.reduce(mergeComplexTypeValidationErrors)
      },
    }
  }

  private generateOpenApiDefinition(): RouteConfig {
    const preAuthorizerScopes = this.preAuthorizer ? this.preAuthorizer.scopes : []
    const authorizerScopes = this.authorizer ? this.authorizer.scopes : []
    const scopes = unique(preAuthorizerScopes.concat(authorizerScopes))

    const routeConfig = {
      method: this.method,
      operationId: this.operationId,
      summary: this.endpointSummary,
      description: this.endpointDescription,
      tags: this.tags,
      path: this.config.openApiPath,
      security: (this.authenticator.openApiDefinition) ? [{ [this.authenticator.name]: scopes }] : [],
      request: {
        params: !isEmptySchema(this.config.schemas.pathParams) ? this.config.schemas.pathParams : undefined,
        query: !isEmptySchema(this.config.schemas.queryParams) ? this.config.schemas.queryParams : undefined,
        cookies: !isEmptySchema(this.config.schemas.requestCookies) ? this.config.schemas.requestCookies : undefined,
        headers: !isEmptySchema(this.config.schemas.requestHeaders) ? this.config.schemas.requestHeaders : undefined,
        ...this.config.requestBodyReader.openApiDefinition &&
        { body: this.config.requestBodyReader.openApiDefinition },
      },
      responses: {
        // TODO - Response cookies? This isn't officially supported by OpenAPI, so the best we can do is document `Set-Cookie` headers here...
        [this.successHttpStatus.toString()]: {
          description: this.config.successResponseWriter.description,
          ...(!isEmptySchema(this.config.schemas.successResponseHeaders)) &&
            { headers: this.config.schemas.successResponseHeaders },
          ...this.config.successResponseWriter.openApiDefinition &&
            { content: this.config.successResponseWriter.openApiDefinition },
        },
        [httpStatus.BAD_REQUEST.toString()]: {
          description: "Returned when the request payload fails to pass validation checks, describing validation errors that occurred",
          ...this.config.validationErrorWriter.openApiDefinition &&
            { content: this.config.validationErrorWriter.openApiDefinition },
        },
        [httpStatus.INTERNAL_SERVER_ERROR.toString()]: {
          description: "Returned when the request could not be processed due to an internal error",
          ...this.config.errorMessageWriter.openApiDefinition &&
            { content: this.config.errorMessageWriter.openApiDefinition },
        },
      },
    }

    // TODO - Error headers and cookies

    if (this.authenticator.openApiDefinition) {
      routeConfig.responses[httpStatus.UNAUTHORIZED] = {
        description: "Returned when the authentication credentials have expired or are invalid",
        ...this.config.errorMessageWriter.openApiDefinition &&
          { content: this.config.errorMessageWriter.openApiDefinition },
      }
    }

    if (this.preAuthorizer || this.authorizer) {
      routeConfig.responses[httpStatus.FORBIDDEN] = {
        description: "Returned when the client has successfully authenticated but does not have permission to access this resource",
        ...this.config.errorMessageWriter.openApiDefinition &&
          { content: this.config.errorMessageWriter.openApiDefinition },
      }
    }

    return routeConfig
  }
}
