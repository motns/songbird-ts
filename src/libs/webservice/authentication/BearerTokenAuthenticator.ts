import { AuthenticatorBase } from "./AuthenticatorBase";
import { z, ZodObject, ZodString } from "zod";
import { AuthenticationResult } from "../../../types/authentication";
import { SecuritySchemeObject, SecuritySchemeType } from "openapi3-ts/src/model/openapi31";
import { HttpRequestHeader } from "../../../enums/http";

class BearerTokenAuthenticator<
  Output
> extends AuthenticatorBase<
  ZodObject<{}>,
  ZodObject<{ [K in HttpRequestHeader.AUTHORIZATION]: ZodString }>,
  ZodObject<{}>,
  Output
> {
  readonly queryParamsSchema = z.object({})
  readonly cookiesSchema = z.object({})
  readonly headersSchema: ZodObject<{ [K in HttpRequestHeader.AUTHORIZATION]: ZodString }>
  readonly securitySchemeType: SecuritySchemeType = "http"

  constructor(
    name: string,
    description: string,
    handler: (
      queryParams: {},
      headers: { [K in HttpRequestHeader.AUTHORIZATION]: string },
      cookies: {},
    ) => Promise<AuthenticationResult<Output>>
  ) {
    super(
      name,
      description,
      handler,
      "Invalid or expired Bearer Token"
    )

    this.headersSchema = z.object({
      [HttpRequestHeader.AUTHORIZATION]: z.string()
    })
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return {
      type: this.securitySchemeType,
      description: this.description,
      scheme: "bearer"
    };
  }
}
