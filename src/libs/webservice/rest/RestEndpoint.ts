import _ from "lodash";
import { z, ZodObject, ZodTypeAny } from "zod";
import { PathParamZodSchema } from "../../../types/urlUtils";
import { HttpMethod, HttpStatus } from "../../../enums/http";
import { SongbirdSanitizedRequest } from "../request/SongbirdSanitizedRequest";
import {
  ComplexTypeValidationErrors,
  ComplexValidationResult,
  RequestValidatorFunction
} from "../../../types/validation";
import { RequestSanitizationResult } from "../../../types/sanitization";
import { mergeComplexTypeValidationErrors } from "../../validation";
import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { AuthenticationResult } from "../../../types/authentication";
import { Authenticator } from "../authentication/Authenticator";
import { Authorizer } from "../authorization/Authorizer";
import { PreAuthorizer } from "../authorization/PreAuthorizer";
import { EndpointParamSchemaType } from "../../../types/webservice";
import { RestEndpointDef } from "./RestEndpointDef";
import { ZodSchemaSanitizer } from "../../sanitisation/ZodSchemaSanitizer";
import { SongbirdRawRequest } from "../request/SongbirdRawRequest";
import { SongbirdBadRequestResponse } from "../response/SongbirdBadRequestResponse";
import { SongbirdResponses } from "../../../types/response";
import { SongbirdUnauthenticatedResponse } from "../response/SongbirdUnauthenticatedResponse";
import { SongbirdUnauthorisedResponse } from "../response/SongbirdUnauthorisedResponse";
import { SongbirdInternalErrorResponse } from "../response/SongbirdInternalErrorResponse";
import { SongbirdOkResponse } from "../response/SongbirdOkResponse";


// TODO - Configuration object for behaviours (for example whether to 404 on invalid path parameters)
export class RestEndpoint<
  RoutePattern extends string,
  PathParamsSchema extends PathParamZodSchema<RoutePattern>,
  QueryParamsSchema extends EndpointParamSchemaType,
  RequestHeadersSchema extends EndpointParamSchemaType,
  RequestCookiesSchema extends EndpointParamSchemaType,
  RequestParserIn,
  RequestParserOut,
  ResponseHeadersSchema extends EndpointParamSchemaType,
  ResponseCookiesSchema extends EndpointParamSchemaType,
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
  readonly endpointDefinition: RestEndpointDef<
    RoutePattern,
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
    ErrorResponseWriterOut
  >

  readonly authenticator: Authenticator<AuthOutput>

  readonly preAuthorizer?: PreAuthorizer<AuthOutput>

  readonly authorizer?: Authorizer<
    z.infer<PathParamsSchema>,
    z.infer<QueryParamsSchema>,
    z.infer<RequestHeadersSchema>,
    z.infer<RequestCookiesSchema>,
    AuthOutput,
    RequestParserOut
  >

  /**
   * @public Request handler function for this endpoint
   */
  readonly handler: (req: SongbirdSanitizedRequest<
    z.infer<PathParamsSchema>,
    z.infer<QueryParamsSchema>,
    z.infer<RequestHeadersSchema>,
    z.infer<RequestCookiesSchema>,
    AuthOutput,
    RequestParserOut
  >) => Promise<{ body: SuccessResponseWriterIn, headers: z.infer<ResponseHeadersSchema> }>
  //>) => Promise<SongbirdResponse<z.infer<ResponseHeadersSchema>, SuccessResponseWriterIn, SuccessResponseWriterOut>>

  /**
   * @public The HTTP status code returned when request is successful - defaults to 200 OK
   */
  readonly successHttpStatus: HttpStatus

  /**
   * @public Used to define additional validators not covered in the first round of Zod validation/sanitization
   */
  readonly additionalRequestValidators?: RequestValidatorFunction<
    z.infer<PathParamsSchema>,
    z.infer<QueryParamsSchema>,
    z.infer<RequestHeadersSchema>,
    RequestParserOut
  >[]

  constructor(
    operationId: string,
    docs: {
      endpointSummary: string,
      endpointDescription: string,
      tags?: string[],
    },
    method: HttpMethod,
    endpointDefinition: RestEndpointDef<
      RoutePattern,
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
      ErrorResponseWriterOut
    >,
    authenticator: Authenticator<AuthOutput>,
    handler: (req: SongbirdSanitizedRequest<
      z.infer<PathParamsSchema>,
      z.infer<QueryParamsSchema>,
      z.infer<RequestHeadersSchema>,
      z.infer<RequestCookiesSchema>,
      AuthOutput,
      RequestParserOut
    >) => Promise<{ body: SuccessResponseWriterIn, headers: z.infer<ResponseHeadersSchema> }>,
    //>) => Promise<SongbirdResponse<z.infer<ResponseHeadersSchema>, SuccessResponseWriterIn, SuccessResponseWriterOut>>,
    preAuthorizer?: PreAuthorizer<AuthOutput>,
    authorizer?: Authorizer<
      z.infer<PathParamsSchema>,
      z.infer<QueryParamsSchema>,
      z.infer<RequestHeadersSchema>,
      z.infer<RequestCookiesSchema>,
      AuthOutput,
      RequestParserOut
    >,
    additionalRequestValidators?: RequestValidatorFunction<
      z.infer<PathParamsSchema>,
      z.infer<QueryParamsSchema>,
      z.infer<RequestHeadersSchema>,
      RequestParserOut
    >[],
    successHttpStatus?: HttpStatus,
  ) {
    this.operationId = operationId
    this.endpointSummary = docs.endpointSummary
    this.endpointDescription = docs.endpointDescription
    this.tags = docs.tags || []
    this.method = method
    this.endpointDefinition = endpointDefinition
    this.authenticator = authenticator
    this.preAuthorizer = preAuthorizer
    this.authorizer = authorizer
    this.handler = handler
    this.additionalRequestValidators = additionalRequestValidators
    this.successHttpStatus = successHttpStatus || HttpStatus.OK
    this.openApiDefinition = this.generateOpenApiDefinition();
  }

  async processRequest(
    rawRequest: SongbirdRawRequest
  ): Promise<
    SongbirdResponses<
      z.infer<ResponseHeadersSchema>,
      SuccessResponseWriterIn,
      SuccessResponseWriterOut,
      ErrorResponseWriterOut
    >
  > {
    try {
      const authenticationResult = await this.authenticateRequest(rawRequest)

      // Authenticators perform their own parameter validation, hence they can also
      // emit their own request validation errors
      if (!authenticationResult.isValid) {
        return new SongbirdBadRequestResponse(
          this.endpointDefinition.validationErrorWriter,
          {}, // TODO
          authenticationResult.validationErrors
        )
      }

      if (!authenticationResult.isAuthenticated) {
        return new SongbirdUnauthenticatedResponse(
          this.endpointDefinition.errorMessageWriter,
          {}, // TODO
          this.authenticator.errorMessage
        )
      }

      const isPreAuthorized = this.preAuthorizeRequest(authenticationResult.output)
      if (!isPreAuthorized) {
        return new SongbirdUnauthorisedResponse(
          this.endpointDefinition.errorMessageWriter,
          {}, // TODO
        )
      }

      const validationResult = await this.sanitizeRequest(rawRequest, authenticationResult.output)

      if (!validationResult.isValid) {
        if (validationResult.validationErrors.pathParam) {
          // TODO - Optional 404 response?
        }

        return new SongbirdBadRequestResponse(
          this.endpointDefinition.validationErrorWriter,
          {}, // TODO
          validationResult.validationErrors
        )
      }

      const isAuthorized = await this.authorizeRequest(validationResult.request);
      if (!isAuthorized) {
        return new SongbirdUnauthorisedResponse(
          this.endpointDefinition.errorMessageWriter,
          {}, // TODO
        )
      }

      const res = await this.handler(validationResult.request)
      return new SongbirdOkResponse(
        res.body,
        this.endpointDefinition.successResponseWriter,
        res.headers
      )
    } catch (e) {
      return new SongbirdInternalErrorResponse(
        this.endpointDefinition.errorMessageWriter,
        {}, // TODO
      )
    }
  }

  private async authenticateRequest(req: SongbirdRawRequest): Promise<AuthenticationResult<AuthOutput>> {
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
  private async authorizeRequest(request: SongbirdSanitizedRequest<
    z.infer<PathParamsSchema>,
    z.infer<QueryParamsSchema>,
    z.infer<RequestHeadersSchema>,
    z.infer<RequestCookiesSchema>,
    AuthOutput,
    RequestParserOut
  >): Promise<boolean> {
    if (!this.authorizer) {
      return true;
    }

    return this.authorizer.isAuthorized(request);
  }

  private async sanitizeRequest(
    rawRequest: SongbirdRawRequest,
    authenticationOutput: AuthOutput
  ): Promise<RequestSanitizationResult<SongbirdSanitizedRequest<
    z.infer<PathParamsSchema>,
    z.infer<QueryParamsSchema>,
    z.infer<RequestHeadersSchema>,
    z.infer<RequestCookiesSchema>,
    AuthOutput,
    RequestParserOut
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
      (new ZodSchemaSanitizer(this.endpointDefinition.schemas.pathParams)).process(rawRequest.pathParams),
      (new ZodSchemaSanitizer(this.endpointDefinition.schemas.queryParams)).process(rawRequest.queryParams),
      (new ZodSchemaSanitizer(this.endpointDefinition.schemas.requestHeaders)).process(rawRequest.headers),
      (new ZodSchemaSanitizer(this.endpointDefinition.schemas.requestCookies)).process(rawRequest.cookies),
      this.endpointDefinition.requestBodyReader.parse(rawRequest.body)
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
        request: new SongbirdSanitizedRequest(
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
        request: new SongbirdSanitizedRequest(
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
    const scopes = _.uniq(preAuthorizerScopes.concat(authorizerScopes))

    let routeConfig = {
      method: this.method,
      operationId: this.operationId,
      summary: this.endpointSummary,
      description: this.endpointDescription,
      tags: this.tags,
      path: this.endpointDefinition.openApiPath,
      security: (this.authenticator.openApiDefinition) ? [{ [this.authenticator.name]: scopes }] : [],
      request: {
        body: this.endpointDefinition.requestBodyReader.getOpenApiDefinition(),
        params: this.endpointDefinition.schemas.pathParams instanceof ZodObject ? this.endpointDefinition.schemas.pathParams : undefined,
        query: this.endpointDefinition.schemas.queryParams !== z.object({}) ? this.endpointDefinition.schemas.queryParams : undefined,
        cookie: this.endpointDefinition.schemas.requestCookies !== z.object({}) ? this.endpointDefinition.schemas.requestCookies : undefined,
        headers: this.endpointDefinition.schemas.requestHeaders !== z.object({}) ? this.endpointDefinition.schemas.requestHeaders : undefined,
      },
      responses: {
        [this.successHttpStatus]: {
          description: this.endpointDefinition.successResponseWriter.description,
          headers: this.endpointDefinition.schemas.responseHeaders !== z.object({}) ? this.endpointDefinition.schemas.responseHeaders: undefined,
          content: this.endpointDefinition.successResponseWriter.getOpenApiDefinition(),
          // TODO - Response cookies? This isn't officially supported by OpenAPI, so the best we can do is document `Set-Cookie` headers here...
        },
        [HttpStatus.BAD_REQUEST]: {
          description: "Returned when the request payload fails to pass validation checks, describing validation errors that occurred",
          content: this.endpointDefinition.validationErrorWriter.getOpenApiDefinition(),
        },
        [HttpStatus.INTERNAL_SERVER_ERROR]: {
          description: "Returned when the request could not be processed due to an internal error",
          content: this.endpointDefinition.errorMessageWriter.getOpenApiDefinition(),
        },
      },
    }

    if (this.authenticator.openApiDefinition) {
      routeConfig.responses[HttpStatus.UNAUTHORIZED] = {
        description: "Returned when the authentication credentials have expired or are invalid",
        content: this.endpointDefinition.errorMessageWriter.getOpenApiDefinition(),
      }
    }

    if (this.preAuthorizer || this.authorizer) {
      routeConfig.responses[HttpStatus.FORBIDDEN] = {
        description: "Returned when the client has successfully authenticated but does not have permission to access this resource",
        content: this.endpointDefinition.errorMessageWriter.getOpenApiDefinition(),
      }
    }

    return routeConfig
  }
}
