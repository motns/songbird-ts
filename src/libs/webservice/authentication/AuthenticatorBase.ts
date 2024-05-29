import { EndpointParamSchemaType } from "../../../types/webservice";
import { SecuritySchemeType } from "openapi3-ts/src/model/openapi31";
import { z } from "zod";
import { AuthenticationResult } from "../../../types/authentication";
import { SongbirdRawRequest } from "../request/SongbirdRawRequest";
import { ZodSchemaSanitizer } from "../../sanitisation/ZodSchemaSanitizer";
import { Authenticator } from "./Authenticator";

export abstract class AuthenticatorBase<
  QueryParamsSchema extends EndpointParamSchemaType,
  HeadersSchema extends EndpointParamSchemaType,
  CookiesSchema extends EndpointParamSchemaType,
  Output,
> extends Authenticator<Output> {
  abstract readonly queryParamsSchema: QueryParamsSchema
  abstract readonly headersSchema: HeadersSchema
  abstract readonly cookiesSchema: CookiesSchema
  abstract readonly securitySchemeType: SecuritySchemeType

  /**
   * @protected Business logic for performing the actual authentication, once the payload has already been validated
   */
  protected readonly handler: (
    queryParams: z.infer<QueryParamsSchema>,
    headers: z.infer<HeadersSchema>,
    cookies: z.infer<CookiesSchema>,
  ) => Promise<AuthenticationResult<Output>>

  protected constructor(
    name: string,
    description: string,
    handler: (
      queryParams: z.infer<QueryParamsSchema>,
      headers: z.infer<HeadersSchema>,
      cookies: z.infer<CookiesSchema>,
    ) => Promise<AuthenticationResult<Output>>,
    errorMessage?: string,
  ) {
    super(name, description, errorMessage);
    this.handler = handler
  }

  async authenticate(req: SongbirdRawRequest): Promise<AuthenticationResult<Output>> {
    const [
      queryParamsSR,
      headersSR,
      cookiesSR,
    ] = await Promise.all([
      (new ZodSchemaSanitizer(this.queryParamsSchema).process(req.queryParams)),
      (new ZodSchemaSanitizer(this.headersSchema).process(req.headers)),
      (new ZodSchemaSanitizer(this.cookiesSchema).process(req.cookies)),
    ])
    const isSanitizationValid =
      queryParamsSR.isValid
      && headersSR.isValid
      && cookiesSR.isValid
    if (!isSanitizationValid) {
      return {
        isValid: false,
        isAuthenticated: false,
        validationErrors: {
          queryParam: (!queryParamsSR.isValid) ? queryParamsSR.validationErrors : undefined,
          header: (!headersSR.isValid) ? headersSR.validationErrors : undefined,
          cookie: (!cookiesSR.isValid) ? cookiesSR.validationErrors : undefined,
        }
      }
    }
    return this.handler(queryParamsSR.data, headersSR.data, cookiesSR.data);
  }
}
