import { AuthenticatorBase } from "./AuthenticatorBase";
import { z, ZodObject, ZodString } from "zod";
import { AuthenticationResult } from "../../../types/authentication";
import { SecuritySchemeObject, SecuritySchemeType } from "openapi3-ts/src/model/openapi31";

abstract class ApiKeyHeaderAuthenticator<
  Output,
  AuthHeader extends string
> extends AuthenticatorBase<
  ZodObject<{}>,
  ZodObject<{ [K in AuthHeader]: ZodString }>,
  ZodObject<{}>,
  Output
> {
  readonly queryParamsSchema = z.object({})
  readonly cookiesSchema = z.object({})
  readonly headersSchema: ZodObject<{ [K in AuthHeader]: ZodString }>
  readonly securitySchemeType: SecuritySchemeType = "apiKey"
  private readonly authHeader: string

  constructor(
    name: string,
    description: string,
    authHeader: AuthHeader,
    handler: (
      queryParams: {},
      headers: { [K in AuthHeader]: string },
      cookies: {},
    ) => Promise<AuthenticationResult<Output>>
  ) {
    super(
      name,
      description,
      handler,
      "Invalid or expired API Key"
    )

    this.authHeader = authHeader
    this.headersSchema = z.object({
      [authHeader]: z.string()
    }) as ZodObject<{ [K in AuthHeader]: ZodString }>
  }

  protected generateOpenApiDefinition(): SecuritySchemeObject | undefined {
    return {
      type: this.securitySchemeType,
      description: this.description,
      name: this.authHeader,
      in: "header"
    };
  }
}

// TODO - Example implementation here?