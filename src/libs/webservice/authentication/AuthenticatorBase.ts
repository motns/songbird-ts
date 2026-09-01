import type { EndpointParamType, PathParamType } from "../../../types/webservice.js";
import { z } from "zod";
import type { AuthenticationResult } from "../../../types/authentication.js";
import { RawRequest } from "../request/RawRequest.js";
import { ZodSchemaSanitizer } from "../.././sanitization/ZodSchemaSanitizer.js";
import { Authenticator } from "./Authenticator.js";


export abstract class AuthenticatorBase<
  PathParams extends PathParamType,
  QueryParams extends EndpointParamType,
  Headers extends EndpointParamType,
  Cookies extends EndpointParamType,
  Output,
> extends Authenticator<Output> {
  readonly pathParamsSchema: z.ZodType<PathParams, unknown>
  readonly queryParamsSchema: z.ZodType<QueryParams, unknown>
  readonly headersSchema: z.ZodType<Headers, unknown>
  readonly cookiesSchema: z.ZodType<Cookies, unknown>

  private readonly pathParamsSanitizer: ZodSchemaSanitizer<PathParams>
  private readonly queryParamsSanitizer: ZodSchemaSanitizer<QueryParams>
  private readonly headersSanitizer: ZodSchemaSanitizer<Headers>
  private readonly cookiesSanitizer: ZodSchemaSanitizer<Cookies>

  /**
   * @protected Business logic for performing the actual authentication, once the payload has already been validated
   */
  protected readonly handler: (
    pathParams: PathParams,
    queryParams: QueryParams,
    headers: Headers,
    cookies: Cookies,
  ) => Promise<AuthenticationResult<Output>>

  protected constructor(
    name: string,
    description: string,
    pathParamsSchema: z.ZodType<PathParams, unknown>,
    queryParamsSchema: z.ZodType<QueryParams, unknown>,
    headersSchema: z.ZodType<Headers, unknown>,
    cookiesSchema: z.ZodType<Cookies, unknown>,
    handler: (
      pathParams: PathParams,
      queryParams: QueryParams,
      headers: Headers,
      cookies: Cookies,
    ) => Promise<AuthenticationResult<Output>>,
    errorMessage?: string,
  ) {
    super(name, description, errorMessage);
    this.pathParamsSchema = pathParamsSchema
    this.queryParamsSchema = queryParamsSchema
    this.headersSchema = headersSchema
    this.cookiesSchema = cookiesSchema

    this.pathParamsSanitizer = new ZodSchemaSanitizer(pathParamsSchema)
    this.queryParamsSanitizer = new ZodSchemaSanitizer(queryParamsSchema)
    this.headersSanitizer = new ZodSchemaSanitizer(headersSchema)
    this.cookiesSanitizer = new ZodSchemaSanitizer(cookiesSchema)

    this.handler = handler
  }

  async authenticate(req: RawRequest): Promise<AuthenticationResult<Output>> {
    const [
      pathParamsSR,
      queryParamsSR,
      headersSR,
      cookiesSR,
    ] = await Promise.all([
      this.pathParamsSanitizer.process(req.pathParams),
      this.queryParamsSanitizer.process(req.queryParams),
      this.headersSanitizer.process(req.headers),
      this.cookiesSanitizer.process(req.cookies),
    ])
    const isSanitizationValid =
      pathParamsSR.isValid
      && queryParamsSR.isValid
      && headersSR.isValid
      && cookiesSR.isValid
    if (!isSanitizationValid) {
      return {
        isValid: false,
        isAuthenticated: false,
        validationErrors: {
          pathParam: (!pathParamsSR.isValid) ? pathParamsSR.validationErrors : undefined,
          queryParam: (!queryParamsSR.isValid) ? queryParamsSR.validationErrors : undefined,
          header: (!headersSR.isValid) ? headersSR.validationErrors : undefined,
          cookie: (!cookiesSR.isValid) ? cookiesSR.validationErrors : undefined,
        }
      }
    }

    return this.handler(
      pathParamsSR.data,
      queryParamsSR.data,
      headersSR.data,
      cookiesSR.data
    );
  }
}
